import { beforeEach, describe, expect, it, vi } from 'vitest';
import { homedir } from 'node:os';
import { join } from 'node:path';

const { crushMocks, hermesMocks } = vi.hoisted(() => ({
    crushMocks: {
        forkCrushSession: vi.fn(),
        forkAndTruncateCrushSession: vi.fn(),
        listCrushRewindPoints: vi.fn(),
    },
    hermesMocks: {
        forkHermesSession: vi.fn(),
        forkAndTruncateHermesSession: vi.fn(),
        listHermesRewindPoints: vi.fn(),
    },
}));

// The fork implementations are mocked, but the error classes stay real so
// the handlers' instanceof mapping matches what the modules would throw.
vi.mock('@/agent/crush/crushSessionFork', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/agent/crush/crushSessionFork')>()),
    ...crushMocks,
}));

vi.mock('@/agent/hermes/hermesSessionFork', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/agent/hermes/hermesSessionFork')>()),
    ...hermesMocks,
}));

import {
    ForkSourceMissingError as CrushForkSourceMissingError,
} from '@/agent/crush/crushSessionFork';
import {
    ForkTruncateIdNotFoundError as HermesForkTruncateIdNotFoundError,
} from '@/agent/hermes/hermesSessionFork';

function machineClient() {
    return {
        id: 'machine-1',
        encryptionKey: new Uint8Array(32),
        encryptionVariant: 'legacy',
    } as any;
}

async function handlers(): Promise<Map<string, (params: any) => Promise<any>>> {
    const { ApiMachineClient } = await import('./apiMachine');
    const client = new ApiMachineClient('token', machineClient());
    client.setRPCHandlers({
        spawnSession: vi.fn(),
        stopSession: vi.fn(),
        requestShutdown: vi.fn(),
    });
    return (client as any).rpcHandlerManager.handlers;
}

describe('ApiMachineClient crush/hermes fork RPCs', () => {
    beforeEach(() => {
        for (const method of [...Object.values(crushMocks), ...Object.values(hermesMocks)]) {
            method.mockReset();
        }
        delete process.env.HAPPY_HERMES_HOME;
    });

    it('forks a crush session from the project crush.db', async () => {
        crushMocks.forkCrushSession.mockReturnValue('crush-forked');

        const result = await (await handlers()).get('machine-1:crush-fork-session')?.({
            directory: '/tmp/project',
            crushSessionId: 'crush-src',
        });

        expect(result).toEqual({ type: 'success', newSessionId: 'crush-forked' });
        expect(crushMocks.forkCrushSession).toHaveBeenCalledWith('/tmp/project/.crush/crush.db', 'crush-src');
    });

    it('duplicates a crush session, truncating after the chosen message', async () => {
        crushMocks.forkAndTruncateCrushSession.mockReturnValue('crush-dup');

        const result = await (await handlers()).get('machine-1:crush-duplicate-session')?.({
            directory: '/tmp/project',
            crushSessionId: 'crush-src',
            cutAfterMessageId: 'msg-7',
        });

        expect(result).toEqual({ type: 'success', newSessionId: 'crush-dup' });
        expect(crushMocks.forkAndTruncateCrushSession).toHaveBeenCalledWith(
            '/tmp/project/.crush/crush.db',
            'crush-src',
            'msg-7',
        );
    });

    it('lists crush rewind points', async () => {
        const points = [{ id: 'msg-1', text: 'hello', timestamp: 1 }];
        crushMocks.listCrushRewindPoints.mockReturnValue(points);

        const result = await (await handlers()).get('machine-1:crush-list-rewind-points')?.({
            directory: '/tmp/project',
            crushSessionId: 'crush-src',
        });

        expect(result).toEqual({ type: 'success', points });
        expect(crushMocks.listCrushRewindPoints).toHaveBeenCalledWith('/tmp/project/.crush/crush.db', 'crush-src');
    });

    it('forks a hermes session from the machine-global state db', async () => {
        hermesMocks.forkHermesSession.mockReturnValue('20260821_120000_abcdef01');

        const result = await (await handlers()).get('machine-1:hermes-fork-session')?.({
            directory: '/tmp/project',
            acpSessionId: 'acp-src',
        });

        expect(result).toEqual({ type: 'success', newSessionId: '20260821_120000_abcdef01' });
        expect(hermesMocks.forkHermesSession).toHaveBeenCalledWith(join(homedir(), '.hermes', 'state.db'), 'acp-src');
    });

    it('honors HAPPY_HERMES_HOME for the hermes state db location', async () => {
        process.env.HAPPY_HERMES_HOME = '/custom/hermes';
        hermesMocks.forkHermesSession.mockReturnValue('h-forked');

        const result = await (await handlers()).get('machine-1:hermes-fork-session')?.({
            acpSessionId: 'acp-src',
        });

        expect(result).toEqual({ type: 'success', newSessionId: 'h-forked' });
        expect(hermesMocks.forkHermesSession).toHaveBeenCalledWith('/custom/hermes/state.db', 'acp-src');
    });

    it('duplicates a hermes session, coercing the message id to a number', async () => {
        hermesMocks.forkAndTruncateHermesSession.mockReturnValue('h-dup');

        const result = await (await handlers()).get('machine-1:hermes-duplicate-session')?.({
            directory: '/tmp/project',
            acpSessionId: 'acp-src',
            cutAfterMessageId: '42',
        });

        expect(result).toEqual({ type: 'success', newSessionId: 'h-dup' });
        expect(hermesMocks.forkAndTruncateHermesSession).toHaveBeenCalledWith(
            join(homedir(), '.hermes', 'state.db'),
            'acp-src',
            42,
        );
    });

    it('lists hermes rewind points', async () => {
        const points = [{ id: 3, text: 'question', timestamp: 1755700003 }];
        hermesMocks.listHermesRewindPoints.mockReturnValue(points);

        const result = await (await handlers()).get('machine-1:hermes-list-rewind-points')?.({
            acpSessionId: 'acp-src',
        });

        expect(result).toEqual({ type: 'success', points });
        expect(hermesMocks.listHermesRewindPoints).toHaveBeenCalledWith(join(homedir(), '.hermes', 'state.db'), 'acp-src');
    });

    it('maps ForkSourceMissingError to a user-facing message', async () => {
        crushMocks.listCrushRewindPoints.mockImplementation(() => {
            throw new CrushForkSourceMissingError('crush-src', '/tmp/project/.crush/crush.db');
        });

        await expect(
            (await handlers()).get('machine-1:crush-list-rewind-points')?.({
                directory: '/tmp/project',
                crushSessionId: 'crush-src',
            }),
        ).rejects.toThrow('session database not found on this machine');
    });

    it('maps ForkTruncateIdNotFoundError to a user-facing message', async () => {
        hermesMocks.forkAndTruncateHermesSession.mockImplementation(() => {
            throw new HermesForkTruncateIdNotFoundError(7, '/x/state.db');
        });

        await expect(
            (await handlers()).get('machine-1:hermes-duplicate-session')?.({
                acpSessionId: 'acp-src',
                cutAfterMessageId: 7,
            }),
        ).rejects.toThrow('chosen rewind point no longer present');
    });

    it('rejects a non-numeric hermes cutAfterMessageId before touching the db', async () => {
        await expect(
            (await handlers()).get('machine-1:hermes-duplicate-session')?.({
                acpSessionId: 'acp-src',
                cutAfterMessageId: 'zzz',
            }),
        ).rejects.toThrow('cutAfterMessageId must be a positive integer');
        expect(hermesMocks.forkAndTruncateHermesSession).not.toHaveBeenCalled();
    });

    it('propagates unexpected fork errors unchanged', async () => {
        crushMocks.forkCrushSession.mockImplementation(() => {
            throw new Error('disk exploded');
        });

        await expect(
            (await handlers()).get('machine-1:crush-fork-session')?.({
                directory: '/tmp/project',
                crushSessionId: 'crush-src',
            }),
        ).rejects.toThrow('disk exploded');
    });
});
