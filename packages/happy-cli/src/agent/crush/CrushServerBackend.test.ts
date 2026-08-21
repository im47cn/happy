import { describe, expect, it, vi } from 'vitest';
import { CrushServerBackend, mapCrushEventToAgentMessages } from './CrushServerBackend';
import { createCrushBackend, registerCrushAgent } from './index';
import { agentRegistry } from '../core';

/** Helper: build a crush SSE envelope around an inner payload. */
function envelope(type: string, inner: unknown): import('./CrushServerBackend').CrushEvent {
  return { type, payload: { type: 'updated', payload: inner } };
}

/** Helper: fresh stream state. */
function freshState(): import('./CrushServerBackend').CrushEventStreamState {
  return { accumulatedText: new Map(), emittedToolParts: new Set() };
}

/** Helper: build a crush assistant message envelope. */
function messageEvent(role: string, messageId: string, parts: unknown[], kind = 'updated') {
  return {
    type: 'message',
    payload: { type: kind, payload: { id: messageId, role, parts } },
  };
}

describe('mapCrushEventToAgentMessages', () => {
  it('streams assistant text as deltas across cumulative message updates', () => {
    const acc = freshState();
    const first = mapCrushEventToAgentMessages(
      messageEvent('assistant', 'm1', [{ type: 'text', data: { text: 'Hello' } }]),
      acc,
    );
    expect(first).toEqual([{ type: 'model-output', textDelta: 'Hello' }]);

    const second = mapCrushEventToAgentMessages(
      messageEvent('assistant', 'm1', [{ type: 'text', data: { text: 'Hello world' } }]),
      acc,
    );
    expect(second).toEqual([{ type: 'model-output', textDelta: ' world' }]);
  });

  it('sends full text when the accumulated text diverges', () => {
    const acc = freshState();
    acc.accumulatedText.set('m1', 'original');
    const result = mapCrushEventToAgentMessages(
      messageEvent('assistant', 'm1', [{ type: 'text', data: { text: 'replaced' } }]),
      acc,
    );
    expect(result).toEqual([{ type: 'model-output', fullText: 'replaced' }]);
  });

  it('ignores user messages and empty updates', () => {
    const acc = freshState();
    expect(mapCrushEventToAgentMessages(messageEvent('user', 'u1', [{ type: 'text', data: { text: 'hi' } }]), acc)).toEqual([]);
    expect(mapCrushEventToAgentMessages(messageEvent('assistant', 'm1', []), acc)).toEqual([]);
  });

  it('maps tool_call parts with parsed input', () => {
    const acc = freshState();
    const result = mapCrushEventToAgentMessages(
      messageEvent('assistant', 'm1', [
        { type: 'tool_call', data: { id: 'tc1', name: 'bash', input: '{"command":"ls"}' } },
      ]),
      acc,
    );
    expect(result).toEqual([{ type: 'tool-call', toolName: 'bash', args: { command: 'ls' }, callId: 'tc1' }]);
  });

  it('maps tool_result parts with tool_call_id', () => {
    const acc = freshState();
    const result = mapCrushEventToAgentMessages(
      messageEvent('assistant', 'm1', [
        { type: 'tool_result', data: { tool_call_id: 'tc1', name: 'bash', content: 'files' } },
      ]),
      acc,
    );
    expect(result).toEqual([{ type: 'tool-result', toolName: 'bash', result: 'files', callId: 'tc1' }]);
  });

  it('does not re-emit tool parts on cumulative updates', () => {
    const acc = freshState();
    const toolPart = { type: 'tool_call', data: { id: 'tc1', name: 'bash', input: '{"command":"ls"}' } };
    const first = mapCrushEventToAgentMessages(
      messageEvent('assistant', 'm1', [toolPart, { type: 'text', data: { text: 'partial' } }]),
      acc,
    );
    expect(first).toEqual([
      { type: 'tool-call', toolName: 'bash', args: { command: 'ls' }, callId: 'tc1' },
      { type: 'model-output', textDelta: 'partial' },
    ]);

    // Same tool part re-sent with more text: only the text delta comes through
    const second = mapCrushEventToAgentMessages(
      messageEvent('assistant', 'm1', [toolPart, { type: 'text', data: { text: 'partial answer' } }]),
      acc,
    );
    expect(second).toEqual([{ type: 'model-output', textDelta: ' answer' }]);
  });

  it('maps run_complete to idle on success and error status on failure', () => {
    const acc = freshState();
    expect(mapCrushEventToAgentMessages(envelope('run_complete', { session_id: 's1', text: 'done' }), acc))
      .toEqual([{ type: 'status', status: 'idle' }]);
    expect(mapCrushEventToAgentMessages(envelope('run_complete', { session_id: 's1', error: 'boom' }), acc))
      .toEqual([{ type: 'status', status: 'error', detail: 'boom' }]);
  });

  it('maps agent lifecycle events', () => {
    const acc = freshState();
    expect(mapCrushEventToAgentMessages(envelope('agent_event', { type: 'agent_started' }), acc))
      .toEqual([{ type: 'status', status: 'running' }]);
    expect(mapCrushEventToAgentMessages(envelope('agent_event', { type: 'agent_busy' }), acc))
      .toEqual([{ type: 'status', status: 'running' }]);
    expect(mapCrushEventToAgentMessages(envelope('agent_event', { type: 'agent_finished' }), acc))
      .toEqual([{ type: 'status', status: 'idle' }]);
    expect(mapCrushEventToAgentMessages(envelope('agent_event', { type: 'agent_error', message: { text: 'kaput' } }), acc))
      .toEqual([{ type: 'status', status: 'error', detail: 'kaput' }]);
  });

  it('maps permission requests with the full request as payload', () => {
    const acc = freshState();
    const request = { id: 'p1', tool_name: 'bash', description: 'run ls', action: 'exec' };
    expect(mapCrushEventToAgentMessages(envelope('permission_request', request), acc))
      .toEqual([{ type: 'permission-request', id: 'p1', reason: 'run ls', payload: request }]);
  });

  it('maps permission notifications', () => {
    const acc = freshState();
    expect(mapCrushEventToAgentMessages(envelope('permission_notification', { tool_call_id: 'tc1', granted: true }), acc))
      .toEqual([{ type: 'permission-response', id: 'tc1', approved: true }]);
    expect(mapCrushEventToAgentMessages(envelope('permission_notification', { tool_call_id: 'tc2', denied: true }), acc))
      .toEqual([{ type: 'permission-response', id: 'tc2', approved: false }]);
  });

  it('returns empty for irrelevant event types', () => {
    const acc = freshState();
    expect(mapCrushEventToAgentMessages({ type: 'mcp_event', payload: { payload: {} } }, acc)).toEqual([]);
    expect(mapCrushEventToAgentMessages({ type: 'session', payload: { payload: {} } }, acc)).toEqual([]);
    expect(mapCrushEventToAgentMessages({ type: 'config_changed' }, acc)).toEqual([]);
  });
});

describe('createCrushBackend', () => {
  it('creates a backend implementing the AgentBackend interface', () => {
    const backend = createCrushBackend({ cwd: process.cwd() });
    expect(backend).toBeTruthy();
    expect(typeof backend.startSession).toBe('function');
    expect(typeof backend.sendPrompt).toBe('function');
    expect(typeof backend.cancel).toBe('function');
    expect(typeof backend.respondToPermission).toBe('function');
    expect(typeof backend.onMessage).toBe('function');
    expect(typeof backend.dispose).toBe('function');
  });
});

describe('registerCrushAgent', () => {
  it('registers the crush factory with the agent registry', () => {
    registerCrushAgent();
    expect(agentRegistry.has('crush')).toBe(true);
    expect(agentRegistry.list()).toContain('crush');

    const backend = agentRegistry.create('crush', { cwd: process.cwd() });
    expect(backend).toBeTruthy();
    expect(typeof backend.startSession).toBe('function');
  });
});

describe('CrushServerBackend session resume', () => {
  /** Wire the server subprocess and SSE subscription out; record HTTP calls. */
  function stubHttp(backend: CrushServerBackend): Array<[string, string]> {
    const calls: Array<[string, string]> = [];
    vi.spyOn(backend as any, 'startCrushServer').mockResolvedValue(undefined);
    vi.spyOn(backend as any, 'subscribeToEvents').mockImplementation(() => undefined);
    vi.spyOn(backend as any, 'httpRequest').mockImplementation(async (method: any, path: any) => {
      calls.push([method, path]);
      if (method === 'POST' && path === '/v1/workspaces') return { id: 'ws-1' };
      if (method === 'GET' && path === '/v1/workspaces/ws-1/sessions/crush-1') return { id: 'crush-1' };
      return null;
    });
    return calls;
  }

  it('resumes the requested session id instead of creating one', async () => {
    const backend = new CrushServerBackend({ agentName: 'crush', cwd: '/tmp/project', resumeSessionId: 'crush-1' });
    const calls = stubHttp(backend);

    const result = await backend.startSession();

    expect(result).toEqual({ sessionId: 'crush-1' });
    expect(calls).not.toContainEqual(['POST', '/v1/workspaces/ws-1/sessions']);
    expect(calls).toContainEqual(['GET', '/v1/workspaces/ws-1/sessions/crush-1']);
  });

  it('fails fast when the resumed session is missing from crush.db', async () => {
    const backend = new CrushServerBackend({ agentName: 'crush', cwd: '/tmp/project', resumeSessionId: 'gone' });
    stubHttp(backend);

    await expect(backend.startSession()).rejects.toThrow('Crush session gone not found');
  });
});
