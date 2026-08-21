import { beforeEach, describe, expect, it, vi } from 'vitest';

const { machineRPC, refreshSessions } = vi.hoisted(() => ({
    machineRPC: vi.fn(),
    refreshSessions: vi.fn(),
}));

vi.mock('./apiSocket', () => ({
    apiSocket: { machineRPC },
}));

vi.mock('./sync', () => ({
    sync: { refreshSessions },
}));

// ops.ts imports storage (for sessionSetAgentModes), which transitively pulls
// in react-native — mock it out, these tests never touch it.
vi.mock('./storage', () => ({
    storage: { getState: vi.fn(() => ({ sessions: {} })) },
}));

describe('crush / hermes fork ops', () => {
    beforeEach(() => {
        machineRPC.mockReset();
        refreshSessions.mockReset();
    });

    it('forks a Crush session and spawns a Crush session resumed to the new id', async () => {
        machineRPC.mockImplementation(async (_machineId: string, method: string) => {
            if (method === 'crush-fork-session') {
                return { type: 'success', newSessionId: 'crush-forked' };
            }
            if (method === 'spawn-happy-session') {
                return { type: 'success', sessionId: 'happy-forked' };
            }
            throw new Error(`unexpected method ${method}`);
        });

        const { forkAndSpawn } = await import('./ops');
        const result = await forkAndSpawn({
            kind: 'crush',
            sessionId: 'happy-source',
            machineId: 'machine-1',
            directory: '/tmp/project',
            crushSessionId: 'crush-source',
        });

        expect(result).toEqual({ type: 'success', sessionId: 'happy-forked' });
        expect(machineRPC).toHaveBeenNthCalledWith(
            1,
            'machine-1',
            'crush-fork-session',
            { directory: '/tmp/project', crushSessionId: 'crush-source' },
        );
        expect(machineRPC).toHaveBeenNthCalledWith(
            2,
            'machine-1',
            'spawn-happy-session',
            expect.objectContaining({
                agent: 'crush',
                directory: '/tmp/project',
                resumeAgentSessionId: 'crush-forked',
                parentSessionId: 'happy-source',
            }),
        );
        expect(refreshSessions).toHaveBeenCalledTimes(1);
    });

    it('forks a Hermes session and spawns a Hermes session resumed to the new id', async () => {
        machineRPC.mockImplementation(async (_machineId: string, method: string) => {
            if (method === 'hermes-fork-session') {
                return { type: 'success', newSessionId: 'acp-forked' };
            }
            if (method === 'spawn-happy-session') {
                return { type: 'success', sessionId: 'happy-forked' };
            }
            throw new Error(`unexpected method ${method}`);
        });

        const { forkAndSpawn } = await import('./ops');
        const result = await forkAndSpawn({
            kind: 'hermes',
            sessionId: 'happy-source',
            machineId: 'machine-1',
            directory: '/tmp/project',
            acpSessionId: 'acp-source',
        }, {
            forkedFromMessageId: 'message-1',
        });

        expect(result).toEqual({ type: 'success', sessionId: 'happy-forked' });
        expect(machineRPC).toHaveBeenNthCalledWith(
            1,
            'machine-1',
            'hermes-fork-session',
            { directory: '/tmp/project', acpSessionId: 'acp-source' },
        );
        expect(machineRPC).toHaveBeenNthCalledWith(
            2,
            'machine-1',
            'spawn-happy-session',
            expect.objectContaining({
                agent: 'hermes',
                directory: '/tmp/project',
                resumeAgentSessionId: 'acp-forked',
                parentSessionId: 'happy-source',
                forkedFromMessageId: 'message-1',
            }),
        );
        expect(refreshSessions).toHaveBeenCalledTimes(1);
    });

    it('duplicates a Crush session from a selected rewind point before spawning', async () => {
        machineRPC.mockImplementation(async (_machineId: string, method: string) => {
            if (method === 'crush-duplicate-session') {
                return { type: 'success', newSessionId: 'crush-cut' };
            }
            if (method === 'spawn-happy-session') {
                return { type: 'success', sessionId: 'happy-cut' };
            }
            throw new Error(`unexpected method ${method}`);
        });

        const { forkAndSpawn } = await import('./ops');
        const result = await forkAndSpawn({
            kind: 'crush',
            sessionId: 'happy-source',
            machineId: 'machine-1',
            directory: '/tmp/project',
            crushSessionId: 'crush-source',
        }, {
            cutAfterCrushMessageId: '5172469f-af1a-4c96-8c5e-30ef092c00d7',
        });

        expect(result).toEqual({ type: 'success', sessionId: 'happy-cut' });
        expect(machineRPC).toHaveBeenNthCalledWith(
            1,
            'machine-1',
            'crush-duplicate-session',
            { directory: '/tmp/project', crushSessionId: 'crush-source', cutAfterMessageId: '5172469f-af1a-4c96-8c5e-30ef092c00d7' },
        );
        expect(machineRPC).toHaveBeenNthCalledWith(
            2,
            'machine-1',
            'spawn-happy-session',
            expect.objectContaining({
                agent: 'crush',
                resumeAgentSessionId: 'crush-cut',
            }),
        );
    });

    it('duplicates a Hermes session from a selected rewind point before spawning', async () => {
        machineRPC.mockImplementation(async (_machineId: string, method: string) => {
            if (method === 'hermes-duplicate-session') {
                return { type: 'success', newSessionId: 'acp-cut' };
            }
            if (method === 'spawn-happy-session') {
                return { type: 'success', sessionId: 'happy-cut' };
            }
            throw new Error(`unexpected method ${method}`);
        });

        const { forkAndSpawn } = await import('./ops');
        const result = await forkAndSpawn({
            kind: 'hermes',
            sessionId: 'happy-source',
            machineId: 'machine-1',
            directory: '/tmp/project',
            acpSessionId: 'acp-source',
        }, {
            cutAfterHermesMessageId: 3,
            forkedFromMessageId: 'message-3',
        });

        expect(result).toEqual({ type: 'success', sessionId: 'happy-cut' });
        expect(machineRPC).toHaveBeenNthCalledWith(
            1,
            'machine-1',
            'hermes-duplicate-session',
            { directory: '/tmp/project', acpSessionId: 'acp-source', cutAfterMessageId: 3 },
        );
        expect(machineRPC).toHaveBeenNthCalledWith(
            2,
            'machine-1',
            'spawn-happy-session',
            expect.objectContaining({
                agent: 'hermes',
                resumeAgentSessionId: 'acp-cut',
                forkedFromMessageId: 'message-3',
            }),
        );
    });

    it('surfaces the fork RPC error without spawning', async () => {
        machineRPC.mockResolvedValue({ type: 'error', errorMessage: 'source session not found' });

        const { forkAndSpawn } = await import('./ops');
        const result = await forkAndSpawn({
            kind: 'crush',
            sessionId: 'happy-source',
            machineId: 'machine-1',
            directory: '/tmp/project',
            crushSessionId: 'crush-source',
        });

        expect(result).toEqual({ type: 'error', errorMessage: 'source session not found' });
        expect(machineRPC).toHaveBeenCalledTimes(1);
        expect(refreshSessions).not.toHaveBeenCalled();
    });
});
