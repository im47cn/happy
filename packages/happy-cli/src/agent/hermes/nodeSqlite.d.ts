/**
 * Minimal ambient declaration for 'node:sqlite' — the pinned @types/node
 * (20.x) predates the module (added in Node 22.5, unflagged from 23.4).
 * Only the surface hermesSessionFork.ts consumes is declared.
 * Delete this file once @types/node ships sqlite.d.ts.
 */

declare module 'node:sqlite' {
    export type SQLInputValue = null | number | bigint | string | Uint8Array;
    export type SQLOutputValue = null | number | bigint | string | Uint8Array;

    export interface StatementSync {
        run(...params: SQLInputValue[]): { changes: number | bigint; lastInsertRowid: number | bigint };
        get(...params: SQLInputValue[]): Record<string, SQLOutputValue> | undefined;
        all(...params: SQLInputValue[]): Array<Record<string, SQLOutputValue>>;
    }

    export class DatabaseSync {
        constructor(path: string, options?: { readOnly?: boolean });
        exec(sql: string): void;
        prepare(sql: string): StatementSync;
        close(): void;
    }
}
