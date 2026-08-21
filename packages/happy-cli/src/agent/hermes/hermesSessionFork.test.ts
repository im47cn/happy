import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import {
    forkHermesSession,
    forkAndTruncateHermesSession,
    listHermesRewindPoints,
    ForkTruncateIdNotFoundError,
    ForkSourceMissingError,
} from './hermesSessionFork';

const SCHEMA_PATH = fileURLToPath(new URL('./__fixtures__/hermesStateSchema.sql', import.meta.url));

const SOURCE_ID = '20260821_100000_0a1b2c3d';
const NEW_ID_PATTERN = /^20\d{6}_\d{6}_[0-9a-f]{8}$/;

describe('hermesSessionFork', () => {
    let testDir: string;
    let dbPath: string;

    beforeEach(async () => {
        testDir = join(tmpdir(), `hermes-fork-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
        await mkdir(testDir, { recursive: true });
        dbPath = join(testDir, 'state.db');
        const db = new DatabaseSync(dbPath);
        db.exec(await readFile(SCHEMA_PATH, 'utf-8'));
        seedSourceSession(db);
        db.close();
    });

    afterEach(async () => {
        if (existsSync(testDir)) {
            await rm(testDir, { recursive: true, force: true });
        }
    });

    /**
     * One full conversation:
     *   1 user "first question" → 2 assistant
     *   3 user "second question" → 4 assistant, 5 tool output
     *   6 user "third question" → 7 assistant
     * plus noise the fork must not mistake for prompts: 8 a rewound
     * (inactive) user row, 9 a tool-result row (role='user' with
     * tool_call_id set).
     */
    function seedSourceSession(db: DatabaseSync): void {
        db.prepare(
            `INSERT INTO sessions (id, source, started_at, model, title, cwd)
             VALUES (?, 'opencola', 1755700000.0, 'claude-fable-5', 'Unique title', '/tmp/proj')`,
        ).run(SOURCE_ID);
        const insert = db.prepare(
            `INSERT INTO messages (id, session_id, role, content, tool_call_id, timestamp, active)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
        );
        const rows: Array<[number, string, string | null, string | null, number, number]> = [
            [1, 'user', 'first question', null, 1755700001.0, 1],
            [2, 'assistant', 'first answer', null, 1755700002.0, 1],
            [3, 'user', 'second question', null, 1755700003.0, 1],
            [4, 'assistant', 'second answer', null, 1755700004.0, 1],
            [5, 'tool', '{"ok":true}', null, 1755700005.0, 1],
            [6, 'user', 'third question', null, 1755700006.0, 1],
            [7, 'assistant', 'third answer', null, 1755700007.0, 1],
            [8, 'user', 'ghost prompt (rewound)', null, 1755700008.0, 0],
            [9, 'user', '{"tool":"result"}', 'call_123', 1755700009.0, 1],
        ];
        for (const [id, role, content, toolCallId, timestamp, active] of rows) {
            insert.run(id, SOURCE_ID, role, content, toolCallId, timestamp, active);
        }
    }

    function readDb(): DatabaseSync {
        return new DatabaseSync(dbPath);
    }

    /** Ordered message contents of a session, by id ASC. */
    function messageContents(sessionId: string): Array<string | null> {
        const db = readDb();
        try {
            const rows = db
                .prepare('SELECT content FROM messages WHERE session_id = ? ORDER BY id')
                .all(sessionId) as Array<{ content: string | null }>;
            return rows.map((r) => r.content);
        } finally {
            db.close();
        }
    }

    function sessionRow(sessionId: string): Record<string, unknown> | undefined {
        const db = readDb();
        try {
            return db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId) as
                | Record<string, unknown>
                | undefined;
        } finally {
            db.close();
        }
    }

    function tableCount(table: 'sessions' | 'messages'): number {
        const db = readDb();
        try {
            return Number((db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n);
        } finally {
            db.close();
        }
    }

    describe('forkHermesSession', () => {
        it('copies the session row and all messages under a fresh id', () => {
            const newId = forkHermesSession(dbPath, SOURCE_ID);

            expect(newId).not.toBe(SOURCE_ID);
            expect(newId).toMatch(NEW_ID_PATTERN);

            const forked = sessionRow(newId);
            expect(forked).toBeDefined();
            expect(forked!.parent_session_id).toBe(SOURCE_ID);
            expect(forked!.source).toBe('opencola');
            expect(forked!.model).toBe('claude-fable-5');
            expect(forked!.cwd).toBe('/tmp/proj');
            // title is dropped: it has a unique index and the fork earns its own
            expect(forked!.title).toBeNull();

            // exact copy: every row including inactive and tool-result noise
            expect(messageContents(newId)).toEqual(messageContents(SOURCE_ID));
            expect(messageContents(newId)).toHaveLength(9);

            // the source session is untouched
            expect(sessionRow(SOURCE_ID)!.title).toBe('Unique title');
            expect(tableCount('messages')).toBe(18);
        });

        it('tolerates repeated forks of a titled session (title unique index)', () => {
            const first = forkHermesSession(dbPath, SOURCE_ID);
            const second = forkHermesSession(dbPath, SOURCE_ID);
            expect(first).not.toBe(second);
            expect(tableCount('sessions')).toBe(3);
        });

        it('throws ForkSourceMissingError for an unknown session', () => {
            expect(() => forkHermesSession(dbPath, '20260101_000000_ffffffff')).toThrow(ForkSourceMissingError);
        });

        it('throws ForkSourceMissingError without creating the db when the file is missing', () => {
            const missing = join(testDir, 'nope.db');
            expect(() => forkHermesSession(missing, SOURCE_ID)).toThrow(ForkSourceMissingError);
            expect(existsSync(missing)).toBe(false);
        });
    });

    describe('forkAndTruncateHermesSession', () => {
        it('keeps messages up to the marker plus the rest of its turn', () => {
            const newId = forkAndTruncateHermesSession(dbPath, SOURCE_ID, 3);

            expect(newId).toMatch(NEW_ID_PATTERN);
            expect(sessionRow(newId)!.parent_session_id).toBe(SOURCE_ID);
            // turn 1 + the marker's turn (assistant + tool output); turn 3 dropped
            expect(messageContents(newId)).toEqual([
                'first question',
                'first answer',
                'second question',
                'second answer',
                '{"ok":true}',
            ]);
            // the source session keeps everything
            expect(messageContents(SOURCE_ID)).toHaveLength(9);
        });

        it('keeps everything when the marker is the last active prompt', () => {
            // inactive row 8 and tool-result row 9 are not cut points
            const newId = forkAndTruncateHermesSession(dbPath, SOURCE_ID, 6);
            expect(messageContents(newId)).toEqual(messageContents(SOURCE_ID));
        });

        it('throws ForkTruncateIdNotFoundError and leaves no partial session behind', () => {
            expect(() => forkAndTruncateHermesSession(dbPath, SOURCE_ID, 999)).toThrow(
                ForkTruncateIdNotFoundError,
            );
            expect(tableCount('sessions')).toBe(1);
            expect(tableCount('messages')).toBe(9);
        });

        it('ignores a marker that belongs to another session', () => {
            const db = readDb();
            db.prepare(
                `INSERT INTO sessions (id, source, started_at) VALUES ('20260821_110000_abcdef01', 'opencola', 1755701000.0)`,
            ).run();
            db.prepare(
                `INSERT INTO messages (id, session_id, role, content, timestamp) VALUES (100, '20260821_110000_abcdef01', 'user', 'other session', 1755701001.0)`,
            ).run();
            db.close();

            expect(() => forkAndTruncateHermesSession(dbPath, SOURCE_ID, 100)).toThrow(
                ForkTruncateIdNotFoundError,
            );
        });

        it('throws ForkSourceMissingError for an unknown session', () => {
            expect(() => forkAndTruncateHermesSession(dbPath, '20260101_000000_ffffffff', 3)).toThrow(
                ForkSourceMissingError,
            );
        });
    });

    describe('listHermesRewindPoints', () => {
        it('returns active user prompts, newest first, excluding noise', () => {
            const points = listHermesRewindPoints(dbPath, SOURCE_ID);

            expect(points).toEqual([
                { id: 6, text: 'third question', timestamp: 1755700006.0 },
                { id: 3, text: 'second question', timestamp: 1755700003.0 },
                { id: 1, text: 'first question', timestamp: 1755700001.0 },
            ]);
        });

        it('throws ForkSourceMissingError for an unknown session', () => {
            expect(() => listHermesRewindPoints(dbPath, '20260101_000000_ffffffff')).toThrow(
                ForkSourceMissingError,
            );
        });
    });
});
