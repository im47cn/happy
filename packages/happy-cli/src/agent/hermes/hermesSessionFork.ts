/**
 * Fork a Hermes session inside its SQLite state database
 * (~/.hermes/state.db) so a brand-new Happy session can resume from a copy
 * of the prior conversation — optionally truncated at a user-chosen
 * message.
 *
 * SQLite counterpart of claude/utils/claudeSessionFork.ts:
 *   - forkHermesSession(...)             → exact row copy, no truncation
 *   - forkAndTruncateHermesSession(...)  → copy every message up to and
 *     including the marker, plus the rest of that turn, dropping the next
 *     user message and everything after it
 *   - listHermesRewindPoints(...)        → active user prompts, newest first
 *
 * The live hermes process may hold the database open, so every connection
 * sets a 5s busy timeout and WAL journaling, and each fork runs inside a
 * single IMMEDIATE transaction: readers never observe a half-copied
 * session. Requires node:sqlite (Node >= 22.5; no flag from Node >= 23.4).
 */

import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { logger } from '@/ui/logger';

export type HermesRewindPoint = {
    id: number;
    text: string;
    timestamp: number;
};

export class ForkTruncateIdNotFoundError extends Error {
    constructor(public readonly cutAfterMessageId: number, public readonly dbPath: string) {
        super(`Truncation message id ${cutAfterMessageId} not found in ${dbPath}`);
        this.name = 'ForkTruncateIdNotFoundError';
    }
}

export class ForkSourceMissingError extends Error {
    constructor(public readonly sourceSessionId: string, public readonly dbPath: string) {
        super(`Source Hermes session not found: ${sourceSessionId} (db: ${dbPath})`);
        this.name = 'ForkSourceMissingError';
    }
}

/** Active user-typed prompt. Tool-result rows (role='user' with tool_call_id
 * set) and rows a prior rewind deactivated don't count. */
const USER_PROMPT_WHERE = `role = 'user' AND tool_call_id IS NULL AND active = 1 AND content IS NOT NULL AND TRIM(content) <> ''`;

function openHermesDb(dbPath: string, sessionId: string): DatabaseSync {
    if (!existsSync(dbPath)) {
        // Fail before DatabaseSync would silently create an empty db file.
        throw new ForkSourceMissingError(sessionId, dbPath);
    }
    const db = new DatabaseSync(dbPath);
    // busy_timeout first: switching journal_mode may itself need the lock
    // that the hermes process is holding.
    db.exec('PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL;');
    return db;
}

/** New session id in hermes' native shape: <YYYYMMDD>_<HHMMSS>_<hex8>. */
function newHermesSessionId(): string {
    const now = new Date();
    const p = (n: number): string => String(n).padStart(2, '0');
    return (
        `${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}` +
        `_${p(now.getHours())}${p(now.getMinutes())}${p(now.getSeconds())}` +
        `_${randomBytes(4).toString('hex')}`
    );
}

/** Column names of `table` straight from the live schema, so future hermes
 * migrations (the ALTER-appended tail columns prove they happen) don't
 * break the fork. */
function tableColumns(db: DatabaseSync, table: string): string[] {
    const rows = db.prepare('SELECT name FROM pragma_table_info(?)').all(table) as Array<{ name: string }>;
    return rows.map((r) => r.name);
}

function quoteIdentifiers(columns: string[]): string {
    return columns.map((c) => `"${c}"`).join(', ');
}

/** Open the db, run `work` inside one IMMEDIATE transaction, commit on
 * success, roll back and rethrow on failure. */
function withForkTxn<T>(dbPath: string, sessionId: string, work: (db: DatabaseSync) => T): T {
    const db = openHermesDb(dbPath, sessionId);
    try {
        db.exec('BEGIN IMMEDIATE');
        try {
            const result = work(db);
            db.exec('COMMIT');
            return result;
        } catch (error) {
            db.exec('ROLLBACK');
            throw error;
        }
    } finally {
        db.close();
    }
}

function assertSourceSession(db: DatabaseSync, dbPath: string, sessionId: string): void {
    const row = db.prepare('SELECT id FROM sessions WHERE id = ?').get(sessionId);
    if (!row) {
        throw new ForkSourceMissingError(sessionId, dbPath);
    }
}

/**
 * Insert a copy of the source session row under `newId`, with
 * parent_session_id pointing at the source. `title` is nulled out: it
 * carries a unique index in the hermes schema, and the forked session
 * should earn its own title from hermes anyway.
 */
function copySessionRow(db: DatabaseSync, sourceSessionId: string, newId: string): void {
    const overrides: Record<string, string> = {
        id: '?',
        parent_session_id: '?',
        title: 'NULL',
    };
    const columns = tableColumns(db, 'sessions');
    const exprs = columns.map((c) => overrides[c] ?? `"${c}"`);
    db.prepare(
        `INSERT INTO sessions (${quoteIdentifiers(columns)}) ` +
            `SELECT ${exprs.join(', ')} FROM sessions WHERE id = ?`,
    ).run(newId, sourceSessionId, sourceSessionId);
}

/**
 * Insert copies of the source session's message rows into the new session.
 * The autoincrement `id` is omitted so new rows get fresh ids — copying it
 * would collide with the originals. Message order (id ASC) is preserved.
 * With `cutBeforeId`, only rows strictly below it are copied.
 */
function copyMessageRows(
    db: DatabaseSync,
    sourceSessionId: string,
    newId: string,
    cutBeforeId: number | null,
): void {
    const kept = tableColumns(db, 'messages').filter((c) => c !== 'id' && c !== 'session_id');
    const params: SQLInputValue[] = [newId, sourceSessionId];
    let sql =
        `INSERT INTO messages (${quoteIdentifiers(['session_id', ...kept])}) ` +
        `SELECT ?, ${quoteIdentifiers(kept)} FROM messages WHERE session_id = ?`;
    if (cutBeforeId !== null) {
        sql += ' AND id < ?';
        params.push(cutBeforeId);
    }
    sql += ' ORDER BY id';
    db.prepare(sql).run(...params);
}

/**
 * Resolve the exclusive upper bound for the truncated copy: the id of the
 * next user prompt after the marker, or +∞ when the marker is the last
 * prompt. Hard-fails if the marker is missing from the source — silently
 * returning a non-truncated copy would lie to the caller about the rewind
 * point, which is worse than failing.
 */
function truncateCutBefore(
    db: DatabaseSync,
    dbPath: string,
    sourceSessionId: string,
    cutAfterMessageId: number,
): number {
    const marker = db
        .prepare('SELECT id FROM messages WHERE session_id = ? AND id = ?')
        .get(sourceSessionId, cutAfterMessageId);
    if (!marker) {
        throw new ForkTruncateIdNotFoundError(cutAfterMessageId, dbPath);
    }
    const next = db
        .prepare(
            `SELECT MIN(id) AS cut FROM messages ` +
                `WHERE session_id = ? AND id > ? AND ${USER_PROMPT_WHERE}`,
        )
        .get(sourceSessionId, cutAfterMessageId) as { cut: number | null } | undefined;
    return next?.cut ?? Number.MAX_SAFE_INTEGER;
}

/** Copy the source session row and all of its messages to a new session id.
 * Returns the new Hermes session id. */
export function forkHermesSession(dbPath: string, sourceSessionId: string): string {
    return withForkTxn(dbPath, sourceSessionId, (db) => {
        assertSourceSession(db, dbPath, sourceSessionId);
        const newId = newHermesSessionId();
        copySessionRow(db, sourceSessionId, newId);
        copyMessageRows(db, sourceSessionId, newId, null);
        logger.debug(`[HERMES FORK] Forked ${sourceSessionId} -> ${newId}`);
        return newId;
    });
}

/**
 * Copy the source session, keeping messages up to and including the marker
 * (`cutAfterMessageId` — a user prompt id from listHermesRewindPoints) plus
 * the remainder of that turn (assistant reply, tool output), and dropping
 * the next user message and everything after it. Returns the new Hermes
 * session id.
 */
export function forkAndTruncateHermesSession(
    dbPath: string,
    sourceSessionId: string,
    cutAfterMessageId: number,
): string {
    return withForkTxn(dbPath, sourceSessionId, (db) => {
        assertSourceSession(db, dbPath, sourceSessionId);
        const cutBeforeId = truncateCutBefore(db, dbPath, sourceSessionId, cutAfterMessageId);
        const newId = newHermesSessionId();
        copySessionRow(db, sourceSessionId, newId);
        copyMessageRows(db, sourceSessionId, newId, cutBeforeId);
        logger.debug(
            `[HERMES FORK] Forked ${sourceSessionId} -> ${newId}, cut after message ${cutAfterMessageId}`,
        );
        return newId;
    });
}

/**
 * List user-typed prompts from a Hermes session — used by the app's
 * DuplicateSheet picker to populate valid rewind points straight from the
 * state db. Newest first. Throws ForkSourceMissingError when the session
 * (or db file) does not exist.
 */
export function listHermesRewindPoints(dbPath: string, sessionId: string): HermesRewindPoint[] {
    const db = openHermesDb(dbPath, sessionId);
    try {
        assertSourceSession(db, dbPath, sessionId);
        const rows = db
            .prepare(
                `SELECT id, content, timestamp FROM messages ` +
                    `WHERE session_id = ? AND ${USER_PROMPT_WHERE} ORDER BY id DESC`,
            )
            .all(sessionId) as Array<{ id: number; content: string; timestamp: number }>;
        return rows.map((r) => ({ id: Number(r.id), text: r.content, timestamp: Number(r.timestamp) }));
    } finally {
        db.close();
    }
}
