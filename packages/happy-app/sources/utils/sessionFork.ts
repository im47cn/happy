import type { Session } from '@/sync/storageTypes';

export type ClaudeForkSource = {
    kind: 'claude';
    sessionId: string;
    machineId: string;
    directory: string;
    claudeSessionId: string;
};

export type CodexForkSource = {
    kind: 'codex';
    sessionId: string;
    machineId: string;
    directory: string;
    codexThreadId: string;
};

export type CrushForkSource = {
    kind: 'crush';
    sessionId: string;
    machineId: string;
    directory: string;
    crushSessionId: string;
};

export type HermesForkSource = {
    kind: 'hermes';
    sessionId: string;
    machineId: string;
    directory: string;
    acpSessionId: string;
};

export type ForkSource = ClaudeForkSource | CodexForkSource | CrushForkSource | HermesForkSource;

function nonEmpty(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
}

export function getSessionForkSource(session: Session): ForkSource | null {
    const machineId = session.metadata?.machineId;
    const directory = session.metadata?.path;
    if (!nonEmpty(machineId) || !nonEmpty(directory)) {
        return null;
    }

    if (session.metadata?.flavor === 'codex') {
        const codexThreadId = session.metadata?.codexThreadId;
        if (!nonEmpty(codexThreadId)) {
            return null;
        }
        return {
            kind: 'codex',
            sessionId: session.id,
            machineId,
            directory,
            codexThreadId,
        };
    }

    if (session.metadata?.flavor === 'crush') {
        const crushSessionId = session.metadata?.crushSessionId;
        if (!nonEmpty(crushSessionId)) {
            return null;
        }
        return {
            kind: 'crush',
            sessionId: session.id,
            machineId,
            directory,
            crushSessionId,
        };
    }

    if (session.metadata?.flavor === 'hermes') {
        const acpSessionId = session.metadata?.acpSessionId;
        if (!nonEmpty(acpSessionId)) {
            return null;
        }
        return {
            kind: 'hermes',
            sessionId: session.id,
            machineId,
            directory,
            acpSessionId,
        };
    }

    const claudeSessionId = session.metadata?.claudeSessionId;
    if (!nonEmpty(claudeSessionId)) {
        return null;
    }
    return {
        kind: 'claude',
        sessionId: session.id,
        machineId,
        directory,
        claudeSessionId,
    };
}
