/**
 * Fork sessions inside the Crush on-disk SQLite database (.crush/crush.db)
 * so a brand-new Happy session can resume a copy of a prior conversation
 * — optionally truncated at a specific user-chosen message.
 *
 * Two surfaces:
 *   - forkCrushSession(...)             → exact copy, no truncation
 *   - forkAndTruncateCrushSession(...)  → copy up to and including the
 *                                         marker message plus the rest of
 *                                         its turn (everything before the
 *                                         next role='user' message)
 *
 * Row identity: messages and files use global TEXT primary keys, so copied
 * rows get fresh UUIDs and a session's summary_message_id is remapped to
 * the new message id. read_files is keyed by (path, session_id) and only
 * needs the session id swapped. message_count is maintained by the
 * database's own AFTER INSERT triggers on messages, so the new session
 * row starts at zero and the trigger counter lands on the copied count.
 *
 * Truncation hard-fails if the marker id is not found in the source.
 * Silently returning a non-truncated copy would lie to the caller about
 * the rewind point, which is worse than failing.
 *
 * Type note: node:sqlite types come from src/agent/hermes/nodeSqlite.d.ts —
 * the pinned @types/node predates the module, and a second ambient
 * declaration for the same members would collide with duplicate ids.
 */

import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { logger } from '@/ui/logger';

export type CrushRewindPoint = {
    id: string;
    text: string;
    timestamp: number;
};

export class ForkTruncateIdNotFoundError extends Error {
    constructor(
        public readonly cutAfterMessageId: string,
        public readonly sourceSessionId: string,
    ) {
        super(`Truncation message id ${cutAfterMessageId} not found in Crush session ${sourceSessionId}`);
        this.name = 'ForkTruncateIdNotFoundError';
    }
}

export class ForkSourceMissingError extends Error {
    constructor(
        public readonly sourceSessionId: string,
        public readonly dbPath: string,
    ) {
        super(`Source Crush session ${sourceSessionId} not found in ${dbPath}`);
        this.name = 'ForkSourceMissingError';
    }
}

interface SourceSessionRow {
    title: string;
    prompt_tokens: number;
    completion_tokens: number;
    cost: number;
    summary_message_id: string | null;
    todos: string | null;
}

interface SourceMessageRow {
    id: string;
    role: string;
    parts: string;
    model: string | null;
    created_at: number;
    updated_at: number;
    finished_at: number | null;
    provider: string | null;
    is_summary_message: number;
}

interface SourceFileRow {
    path: string;
    content: string;
    version: number;
    created_at: number;
    updated_at: number;
}

/**
 * Open the Crush database with the concurrency PRAGMAs a fork needs:
 * WAL so the crush server's readers never block our writes, busy_timeout
 * so a concurrent writer defers SQLITE_BUSY instead of failing the fork.
 */
function openCrushDb(dbPath: string): DatabaseSync {
    const db = new DatabaseSync(dbPath);
    db.exec('PRAGMA journal_mode = WAL');
    db.exec('PRAGMA busy_timeout = 5000');
    return db;
}

/**
 * Load the source session row and its messages in conversation order.
 * Ordering is (created_at, rowid): crush writes second-granularity
 * timestamps, so same-second inserts break ties on insertion order.
 */
function loadSource(
    db: DatabaseSync,
    dbPath: string,
    sourceSessionId: string,
): { source: SourceSessionRow; messages: SourceMessageRow[] } {
    const source = db
        .prepare(
            'SELECT title, prompt_tokens, completion_tokens, cost, summary_message_id, todos FROM sessions WHERE id = ?',
        )
        .get(sourceSessionId) as SourceSessionRow | undefined;
    if (source === undefined) {
        throw new ForkSourceMissingError(sourceSessionId, dbPath);
    }
    const messages = db
        .prepare(
            `SELECT id, role, parts, model, created_at, updated_at, finished_at, provider, is_summary_message
             FROM messages WHERE session_id = ? ORDER BY created_at ASC, rowid ASC`,
        )
        .all(sourceSessionId) as unknown as SourceMessageRow[];
    return { source, messages };
}

/**
 * Insert the forked session row plus copies of every kept message, every
 * file snapshot and the read_files log. Runs inside the caller's
 * transaction — a failure anywhere leaves no half-forked session behind.
 */
function insertForkedSession(
    db: DatabaseSync,
    source: SourceSessionRow,
    sourceSessionId: string,
    keptMessages: SourceMessageRow[],
): string {
    const newId = randomUUID();
    // Crush stores second-granularity timestamps; the fork row follows suit.
    const now = Math.floor(Date.now() / 1000);

    // Messages get fresh ids (their PKs are global and still owned by the
    // source rows); the parallel array keeps summary_message_id pointing
    // at the copied message, or NULL when the summary message was truncated.
    const newMessageIds = keptMessages.map(() => randomUUID());
    const summaryIndex = source.summary_message_id !== null
        ? keptMessages.findIndex((message) => message.id === source.summary_message_id)
        : -1;

    db.prepare(
        `INSERT INTO sessions
             (id, parent_session_id, title, message_count,
              prompt_tokens, completion_tokens, cost,
              created_at, updated_at, summary_message_id, todos)
         VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
        newId,
        sourceSessionId,
        source.title,
        source.prompt_tokens,
        source.completion_tokens,
        source.cost,
        now,
        now,
        summaryIndex >= 0 ? newMessageIds[summaryIndex] : null,
        source.todos,
    );

    const insertMessage = db.prepare(
        `INSERT INTO messages
             (id, session_id, role, parts, model,
              created_at, updated_at, finished_at, provider, is_summary_message)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (let i = 0; i < keptMessages.length; i++) {
        const message = keptMessages[i];
        insertMessage.run(
            newMessageIds[i],
            newId,
            message.role,
            message.parts,
            message.model,
            message.created_at,
            message.updated_at,
            message.finished_at,
            message.provider,
            message.is_summary_message,
        );
    }

    const insertFile = db.prepare(
        `INSERT INTO files (id, session_id, path, content, version, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
    );
    const fileRows = db
        .prepare('SELECT path, content, version, created_at, updated_at FROM files WHERE session_id = ?')
        .all(sourceSessionId) as unknown as SourceFileRow[];
    for (const file of fileRows) {
        insertFile.run(randomUUID(), newId, file.path, file.content, file.version, file.created_at, file.updated_at);
    }

    db.prepare(
        'INSERT INTO read_files (session_id, path, read_at) SELECT ?, path, read_at FROM read_files WHERE session_id = ?',
    ).run(newId, sourceSessionId);

    return newId;
}

/**
 * Run a fork inside a single IMMEDIATE transaction: readers see either the
 * full fork or none of it, and the source rows are never modified.
 */
function runInForkTransaction(dbPath: string, sourceSessionId: string, fork: (db: DatabaseSync) => string): string {
    if (!existsSync(dbPath)) {
        throw new ForkSourceMissingError(sourceSessionId, dbPath);
    }
    const db = openCrushDb(dbPath);
    try {
        db.exec('BEGIN IMMEDIATE');
        const newId = fork(db);
        db.exec('COMMIT');
        return newId;
    } catch (error) {
        try {
            db.exec('ROLLBACK');
        } catch {
            // BEGIN itself failed — there is no transaction to roll back.
        }
        throw error;
    } finally {
        db.close();
    }
}

/**
 * Copy a Crush session (sessions/messages/files/read_files rows) into a
 * brand-new session id under the same database, linking back via
 * parent_session_id. The source is left untouched.
 */
export function forkCrushSession(dbPath: string, sourceSessionId: string): string {
    const newId = runInForkTransaction(dbPath, sourceSessionId, (db) => {
        const { source, messages } = loadSource(db, dbPath, sourceSessionId);
        return insertForkedSession(db, source, sourceSessionId, messages);
    });
    logger.debug(`[CRUSH FORK] Forked ${sourceSessionId} -> ${newId}`);
    return newId;
}

/**
 * Copy the source session into a new one, keeping messages from the start
 * through `cutAfterMessageId` inclusive, plus every message after the
 * marker that belongs to the same turn — i.e. up to, but not including,
 * the next role='user' message. Tool calls/results are stored as their own
 * role='tool' rows in Crush, so they stay inside the turn. The marker may
 * be a message of any role.
 *
 * Throws `ForkTruncateIdNotFoundError` if the marker is not found in the
 * source — we refuse to silently produce a full copy when truncation was
 * requested.
 */
export function forkAndTruncateCrushSession(dbPath: string, sourceSessionId: string, cutAfterMessageId: string): string {
    const newId = runInForkTransaction(dbPath, sourceSessionId, (db) => {
        const { source, messages } = loadSource(db, dbPath, sourceSessionId);
        const markerIndex = messages.findIndex((message) => message.id === cutAfterMessageId);
        if (markerIndex < 0) {
            throw new ForkTruncateIdNotFoundError(cutAfterMessageId, sourceSessionId);
        }
        let end = markerIndex + 1;
        while (end < messages.length && messages[end].role !== 'user') {
            end += 1;
        }
        return insertForkedSession(db, source, sourceSessionId, messages.slice(0, end));
    });
    logger.debug(`[CRUSH FORK] Forked ${sourceSessionId} -> ${newId}, cut after ${cutAfterMessageId}`);
    return newId;
}

/**
 * List user text messages from a Crush session — used by the app's
 * DuplicateSheet picker to populate a list of valid rewind points directly
 * from the database, newest first. A user message qualifies when its parts
 * JSON array carries a non-empty text payload ({type:'text', data:{text}}).
 */
export function listCrushRewindPoints(dbPath: string, sessionId: string): CrushRewindPoint[] {
    if (!existsSync(dbPath)) {
        throw new ForkSourceMissingError(sessionId, dbPath);
    }
    const db = new DatabaseSync(dbPath, { readOnly: true });
    try {
        db.exec('PRAGMA busy_timeout = 5000');
        const session = db.prepare('SELECT id FROM sessions WHERE id = ?').get(sessionId);
        if (session === undefined) {
            throw new ForkSourceMissingError(sessionId, dbPath);
        }
        const rows = db
            .prepare(
                `SELECT id, parts, created_at FROM messages
                 WHERE session_id = ? AND role = 'user'
                 ORDER BY created_at DESC, rowid DESC`,
            )
            .all(sessionId) as Array<{ id: string; parts: string; created_at: number }>;
        const points: CrushRewindPoint[] = [];
        for (const row of rows) {
            const text = firstTextPart(row.parts);
            if (text === null) continue;
            points.push({ id: row.id, text, timestamp: row.created_at });
        }
        return points;
    } finally {
        db.close();
    }
}

/**
 * First non-empty text payload in a parts JSON string array, or null when
 * the message carries no user-visible text.
 */
function firstTextPart(partsJson: string): string | null {
    let parts: any;
    try {
        parts = JSON.parse(partsJson);
    } catch {
        return null;
    }
    if (!Array.isArray(parts)) return null;
    for (const part of parts) {
        const text: unknown = part?.data?.text;
        if (part?.type === 'text' && typeof text === 'string' && text.trim().length > 0) {
            return text;
        }
    }
    return null;
}
