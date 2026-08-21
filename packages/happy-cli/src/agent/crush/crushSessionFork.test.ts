import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { DatabaseSync } from 'node:sqlite';
import {
    forkCrushSession,
    forkAndTruncateCrushSession,
    listCrushRewindPoints,
    ForkTruncateIdNotFoundError,
    ForkSourceMissingError,
} from './crushSessionFork';

/**
 * Schema mirrored from a real .crush/crush.db (via `sqlite3 .schema`).
 * The message_count triggers are load-bearing for the fork: copied
 * messages maintain the new session's counter through AFTER INSERT.
 */
const SCHEMA = `
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    parent_session_id TEXT,
    title TEXT NOT NULL,
    message_count INTEGER NOT NULL DEFAULT 0 CHECK (message_count >= 0),
    prompt_tokens  INTEGER NOT NULL DEFAULT 0 CHECK (prompt_tokens >= 0),
    completion_tokens  INTEGER NOT NULL DEFAULT 0 CHECK (completion_tokens>= 0),
    cost REAL NOT NULL DEFAULT 0.0 CHECK (cost >= 0.0),
    updated_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    summary_message_id TEXT,
    todos TEXT
);
CREATE TRIGGER update_sessions_updated_at
AFTER UPDATE ON sessions
BEGIN
UPDATE sessions SET updated_at = strftime('%s', 'now')
WHERE id = new.id;
END;
CREATE TABLE files (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    path TEXT NOT NULL,
    content TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE,
    UNIQUE(path, session_id, version)
);
CREATE INDEX idx_files_session_id ON files (session_id);
CREATE INDEX idx_files_path ON files (path);
CREATE TRIGGER update_files_updated_at
AFTER UPDATE ON files
BEGIN
UPDATE files SET updated_at = strftime('%s', 'now')
WHERE id = new.id;
END;
CREATE TABLE messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL,
    parts TEXT NOT NULL default '[]',
    model TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    finished_at INTEGER,
    provider TEXT,
    is_summary_message INTEGER DEFAULT 0 NOT NULL,
    FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE
);
CREATE INDEX idx_messages_session_id ON messages (session_id);
CREATE TRIGGER update_messages_updated_at
AFTER UPDATE ON messages
BEGIN
UPDATE messages SET updated_at = strftime('%s', 'now')
WHERE id = new.id;
END;
CREATE TRIGGER update_session_message_count_on_insert
AFTER INSERT ON messages
BEGIN
UPDATE sessions SET
    message_count = message_count + 1
WHERE id = new.session_id;
END;
CREATE TRIGGER update_session_message_count_on_delete
AFTER DELETE ON messages
BEGIN
UPDATE sessions SET
    message_count = message_count - 1
WHERE id = old.session_id;
END;
CREATE INDEX idx_sessions_created_at ON sessions (created_at);
CREATE INDEX idx_messages_created_at ON messages (created_at);
CREATE INDEX idx_files_created_at ON files (created_at);
CREATE TABLE read_files (
    session_id TEXT NOT NULL CHECK (session_id != ''),
    path TEXT NOT NULL CHECK (path != ''),
    read_at INTEGER NOT NULL,
    FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE,
    PRIMARY KEY (path, session_id)
);
`;

// Second-granularity like real crush rows; offsets keep ordering deterministic.
const T0 = 1785200000;
const sourceId = '11111111-1111-1111-1111-111111111111';

type Role = 'user' | 'assistant' | 'tool';

function userTextParts(text: string): Array<{ type: string; data: Record<string, unknown> }> {
    return [
        { type: 'text', data: { text } },
        { type: 'finish', data: { reason: 'stop', time: 0 } },
    ];
}

function seedSession(db: DatabaseSync, id: string, title: string, createdAt: number): void {
    db.prepare('INSERT INTO sessions (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)').run(id, title, createdAt, createdAt);
}

function seedMessage(db: DatabaseSync, sessionId: string, id: string, role: Role, parts: object[], offset: number): void {
    db.prepare('INSERT INTO messages (id, session_id, role, parts, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run(id, sessionId, role, JSON.stringify(parts), T0 + offset, T0 + offset);
}

function seedFile(db: DatabaseSync, sessionId: string, id: string, path: string, version: number, offset: number): void {
    db.prepare('INSERT INTO files (id, session_id, path, content, version, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(id, sessionId, path, 'file body', version, T0 + offset, T0 + offset);
}

function seedReadFile(db: DatabaseSync, sessionId: string, path: string, offset: number): void {
    db.prepare('INSERT INTO read_files (session_id, path, read_at) VALUES (?, ?, ?)').run(sessionId, path, T0 + offset);
}

describe('crushSessionFork', () => {
    let workDir: string;
    let dbPath: string;
    let db: DatabaseSync;

    beforeEach(async () => {
        workDir = await mkdtemp(join(tmpdir(), 'crush-fork-test-'));
        dbPath = join(workDir, 'crush.db');
        db = new DatabaseSync(dbPath);
        db.exec(SCHEMA);
    });

    afterEach(async () => {
        db.close();
        await rm(workDir, { recursive: true, force: true });
    });

    describe('forkCrushSession', () => {
        it('copies session row, messages, files and read_files under a fresh id with parent set', () => {
            seedSession(db, sourceId, 'fork me', T0);
            db.prepare('UPDATE sessions SET prompt_tokens = 42, completion_tokens = 7, cost = 0.5 WHERE id = ?').run(sourceId);
            seedMessage(db, sourceId, 'm1', 'user', userTextParts('first'), 0);
            seedMessage(db, sourceId, 'm2', 'assistant', [{ type: 'text', data: { text: 'reply' } }], 1);
            seedMessage(db, sourceId, 'm3', 'tool', [{ type: 'tool_result', data: { content: 'ls' } }], 2);
            seedFile(db, sourceId, 'f1', 'src/index.ts', 0, 0);
            seedFile(db, sourceId, 'f2', 'src/index.ts', 1, 3);
            seedReadFile(db, sourceId, 'src/index.ts', 0);
            seedReadFile(db, sourceId, 'src/other.ts', 1);

            const newId = forkCrushSession(dbPath, sourceId);
            expect(newId).not.toBe(sourceId);
            expect(newId).toMatch(/^[0-9a-f-]{36}$/);

            const forked = db.prepare('SELECT * FROM sessions WHERE id = ?').get(newId) as any;
            expect(forked.parent_session_id).toBe(sourceId);
            expect(forked.title).toBe('fork me');
            expect(forked.prompt_tokens).toBe(42);
            expect(forked.completion_tokens).toBe(7);
            expect(forked.cost).toBe(0.5);
            // Trigger-maintained: one insert per copied message from a zero start.
            expect(forked.message_count).toBe(3);

            const messages = db
                .prepare('SELECT id, role, parts FROM messages WHERE session_id = ? ORDER BY created_at ASC')
                .all(newId) as Array<{ id: string; role: string; parts: string }>;
            expect(messages.map((m) => m.role)).toEqual(['user', 'assistant', 'tool']);
            expect(JSON.parse(messages[0].parts)).toEqual(userTextParts('first'));
            const copiedIds = messages.map((m) => m.id);
            expect(copiedIds).not.toContain('m1');
            expect(copiedIds).not.toContain('m2');
            expect(copiedIds).not.toContain('m3');

            const files = db.prepare('SELECT path, version, content FROM files WHERE session_id = ? ORDER BY version').all(newId);
            expect(files).toEqual([
                { path: 'src/index.ts', version: 0, content: 'file body' },
                { path: 'src/index.ts', version: 1, content: 'file body' },
            ]);
            expect((db.prepare('SELECT COUNT(*) AS n FROM files WHERE session_id = ?').get(newId) as any).n).toBe(2);

            const readFiles = db.prepare('SELECT path, read_at FROM read_files WHERE session_id = ?').all(newId);
            expect(readFiles).toEqual([
                { path: 'src/index.ts', read_at: T0 },
                { path: 'src/other.ts', read_at: T0 + 1 },
            ]);

            // Source untouched.
            const sourceMessages = db.prepare('SELECT id FROM messages WHERE session_id = ?').all(sourceId);
            expect(sourceMessages).toHaveLength(3);
            const sourceSession = db.prepare('SELECT message_count FROM sessions WHERE id = ?').get(sourceId) as any;
            expect(sourceSession.message_count).toBe(3);
        });

        it('remaps summary_message_id to the copied message id', () => {
            seedSession(db, sourceId, 'summarized', T0);
            seedMessage(db, sourceId, 'm1', 'user', userTextParts('first'), 0);
            seedMessage(db, sourceId, 'm2', 'assistant', [{ type: 'text', data: { text: 'summary line' } }], 1);
            db.prepare('UPDATE sessions SET summary_message_id = ? WHERE id = ?').run('m2', sourceId);

            const newId = forkCrushSession(dbPath, sourceId);
            const forked = db.prepare('SELECT summary_message_id FROM sessions WHERE id = ?').get(newId) as any;
            const copied = db.prepare('SELECT id FROM messages WHERE session_id = ? AND role = ?').all(newId, 'assistant');
            expect(forked.summary_message_id).toBe((copied[0] as any).id);
            expect(forked.summary_message_id).not.toBe('m2');
        });

        it('throws ForkSourceMissingError when the source session is absent', () => {
            seedSession(db, sourceId, 'solo', T0);
            expect(() => forkCrushSession(dbPath, 'does-not-exist')).toThrow(ForkSourceMissingError);
        });

        it('throws ForkSourceMissingError when the database file is absent', () => {
            expect(() => forkCrushSession(join(workDir, 'nope.db'), sourceId)).toThrow(ForkSourceMissingError);
        });
    });

    describe('forkAndTruncateCrushSession', () => {
        it('keeps the chosen turn complete (user + tool cycle + response) and drops the next prompt onwards', () => {
            seedSession(db, sourceId, 'truncate me', T0);
            seedMessage(db, sourceId, 'u1', 'user', userTextParts('list files'), 0);
            seedMessage(db, sourceId, 'a1', 'assistant', [{ type: 'tool_call', data: { id: 'c1', name: 'ls' } }], 1);
            seedMessage(db, sourceId, 't1', 'tool', [{ type: 'tool_result', data: { content: 'file body' } }], 2);
            seedMessage(db, sourceId, 'a2', 'assistant', [{ type: 'text', data: { text: 'final answer' } }], 3);
            seedMessage(db, sourceId, 'u2', 'user', userTextParts('next prompt'), 4);
            seedMessage(db, sourceId, 'a3', 'assistant', [{ type: 'text', data: { text: 'gone' } }], 5);
            seedMessage(db, sourceId, 'u3', 'user', userTextParts('also gone'), 6);

            const newId = forkAndTruncateCrushSession(dbPath, sourceId, 'u1');
            const kept = db
                .prepare('SELECT role FROM messages WHERE session_id = ? ORDER BY created_at ASC')
                .all(newId);
            expect(kept).toEqual([
                { role: 'user' },
                { role: 'assistant' },
                { role: 'tool' },
                { role: 'assistant' },
            ]);
            const forked = db.prepare('SELECT message_count, parent_session_id FROM sessions WHERE id = ?').get(newId) as any;
            expect(forked.message_count).toBe(4);
            expect(forked.parent_session_id).toBe(sourceId);
        });

        it('cut at the last user prompt keeps everything after it to the end', () => {
            seedSession(db, sourceId, 'truncate me', T0);
            seedMessage(db, sourceId, 'u1', 'user', userTextParts('first'), 0);
            seedMessage(db, sourceId, 'a1', 'assistant', [{ type: 'text', data: { text: 'reply' } }], 1);
            seedMessage(db, sourceId, 'u2', 'user', userTextParts('last prompt'), 2);
            seedMessage(db, sourceId, 'a2', 'assistant', [{ type: 'text', data: { text: 'last reply' } }], 3);

            const newId = forkAndTruncateCrushSession(dbPath, sourceId, 'u2');
            const kept = db
                .prepare('SELECT role FROM messages WHERE session_id = ? ORDER BY created_at ASC')
                .all(newId);
            expect(kept).toEqual([
                { role: 'user' },
                { role: 'assistant' },
                { role: 'user' },
                { role: 'assistant' },
            ]);
        });

        it('nulls summary_message_id when the summarized message is truncated away', () => {
            seedSession(db, sourceId, 'summarized', T0);
            seedMessage(db, sourceId, 'u1', 'user', userTextParts('first'), 0);
            seedMessage(db, sourceId, 'u2', 'user', userTextParts('second'), 1);
            seedMessage(db, sourceId, 'a2', 'assistant', [{ type: 'text', data: { text: 'summary' } }], 2);
            db.prepare('UPDATE sessions SET summary_message_id = ? WHERE id = ?').run('a2', sourceId);

            const newId = forkAndTruncateCrushSession(dbPath, sourceId, 'u1');
            const forked = db.prepare('SELECT summary_message_id FROM sessions WHERE id = ?').get(newId) as any;
            expect(forked.summary_message_id).toBeNull();
        });

        it('hard-fails with ForkTruncateIdNotFoundError when the marker is absent and leaves no new session', () => {
            seedSession(db, sourceId, 'truncate me', T0);
            seedMessage(db, sourceId, 'u1', 'user', userTextParts('first'), 0);

            expect(() => forkAndTruncateCrushSession(dbPath, sourceId, 'nope'))
                .toThrow(ForkTruncateIdNotFoundError);
            expect((db.prepare('SELECT COUNT(*) AS n FROM sessions').get() as any).n).toBe(1);
        });

        it('throws ForkSourceMissingError when the source session is absent', () => {
            seedSession(db, sourceId, 'solo', T0);
            expect(() => forkAndTruncateCrushSession(dbPath, 'does-not-exist', 'u1'))
                .toThrow(ForkSourceMissingError);
        });
    });

    describe('listCrushRewindPoints', () => {
        it('lists user text messages newest first with id, text and timestamp', () => {
            seedSession(db, sourceId, 'points', T0);
            seedMessage(db, sourceId, 'u1', 'user', userTextParts('first prompt'), 0);
            seedMessage(db, sourceId, 'a1', 'assistant', [{ type: 'text', data: { text: 'reply' } }], 1);
            seedMessage(db, sourceId, 't1', 'tool', [{ type: 'tool_result', data: { content: 'ls' } }], 2);
            seedMessage(db, sourceId, 'u2', 'user', userTextParts('second prompt'), 3);
            seedMessage(db, sourceId, 'u3', 'user', userTextParts('third prompt'), 4);

            expect(listCrushRewindPoints(dbPath, sourceId)).toEqual([
                { id: 'u3', text: 'third prompt', timestamp: T0 + 4 },
                { id: 'u2', text: 'second prompt', timestamp: T0 + 3 },
                { id: 'u1', text: 'first prompt', timestamp: T0 },
            ]);
        });

        it('skips user messages whose parts carry no text', () => {
            seedSession(db, sourceId, 'points', T0);
            seedMessage(db, sourceId, 'u1', 'user', userTextParts('real prompt'), 0);
            seedMessage(db, sourceId, 'u2', 'user', [{ type: 'finish', data: { reason: 'stop', time: 0 } }], 1);

            const points = listCrushRewindPoints(dbPath, sourceId);
            expect(points.map((p) => p.id)).toEqual(['u1']);
        });

        it('throws ForkSourceMissingError when the session is absent', () => {
            seedSession(db, sourceId, 'solo', T0);
            expect(() => listCrushRewindPoints(dbPath, 'does-not-exist')).toThrow(ForkSourceMissingError);
        });

        it('throws ForkSourceMissingError when the database file is absent', () => {
            expect(() => listCrushRewindPoints(join(workDir, 'nope.db'), sourceId)).toThrow(ForkSourceMissingError);
        });
    });
});
