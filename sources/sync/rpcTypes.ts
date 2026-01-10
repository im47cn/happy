/**
 * @fileoverview RPC Type Definitions for Mobile Remote Control
 * @input Design document 2.2 RPC interface specification
 * @output TypeScript type definitions for mobile RPC requests and responses
 * @pos Mobile sync layer providing type contracts for remote control communication
 *
 * 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的CLAUDE.md。
 */

import { z } from 'zod';

// ============================================================================
// RPC Method Naming Convention
// ============================================================================
// Format: {sessionId}:{category}.{action}
// Categories: control, permission, state
// Examples: abc123:control.pause, abc123:permission.respond

// ============================================================================
// Common Types
// ============================================================================

/**
 * Standard RPC response for operations that return success/failure
 */
export const RpcSuccessResponseSchema = z.object({
  /** Whether the operation succeeded */
  success: z.boolean(),
  /** Error message if operation failed */
  error: z.string().optional(),
});

export type RpcSuccessResponse = z.infer<typeof RpcSuccessResponseSchema>;

// ============================================================================
// Session Mode and State Types
// ============================================================================

/**
 * Session mode - local (terminal) or remote (mobile-controlled)
 */
export const SessionModeSchema = z.enum(['local', 'remote']);

export type SessionMode = z.infer<typeof SessionModeSchema>;

/**
 * Execution state of the AI agent
 */
export const ExecutionStateSchema = z.enum([
  'idle',     // Ready for input, not processing
  'thinking', // AI is processing/generating
  'waiting',  // Waiting for permission approval
  'paused',   // Session is paused by user
]);

export type ExecutionState = z.infer<typeof ExecutionStateSchema>;

/**
 * AI backend type
 */
export const BackendTypeSchema = z.enum(['claude', 'codex', 'gemini']);

export type BackendType = z.infer<typeof BackendTypeSchema>;

// ============================================================================
// Control Category - Session Execution Control
// ============================================================================

/**
 * Parameters for control.pause RPC request
 * Purpose: Pause the current AI agent execution
 */
export const ControlPauseRequestSchema = z.object({
  /** RPC method identifier */
  method: z.literal('control.pause'),
  /** Target session ID */
  sessionId: z.string(),
  /** Empty params object */
  params: z.object({}),
});

export type ControlPauseRequest = z.infer<typeof ControlPauseRequestSchema>;

/**
 * Parameters for control.resume RPC request
 * Purpose: Resume paused AI agent execution
 */
export const ControlResumeRequestSchema = z.object({
  /** RPC method identifier */
  method: z.literal('control.resume'),
  /** Target session ID */
  sessionId: z.string(),
  /** Empty params object */
  params: z.object({}),
});

export type ControlResumeRequest = z.infer<typeof ControlResumeRequestSchema>;

/**
 * Parameters for control.terminate RPC request
 * Purpose: Terminate the current AI session and cleanup resources
 */
export const ControlTerminateRequestSchema = z.object({
  /** RPC method identifier */
  method: z.literal('control.terminate'),
  /** Target session ID */
  sessionId: z.string(),
  /** Empty params object */
  params: z.object({}),
});

export type ControlTerminateRequest = z.infer<typeof ControlTerminateRequestSchema>;

/**
 * Parameters for control.switchMode RPC request
 * Purpose: Switch session between local (terminal) and remote (mobile) modes
 */
export const ControlSwitchModeRequestSchema = z.object({
  /** RPC method identifier */
  method: z.literal('control.switchMode'),
  /** Target session ID */
  sessionId: z.string(),
  /** Request parameters */
  params: z.object({
    /** Target mode to switch to */
    mode: SessionModeSchema,
  }),
});

export type ControlSwitchModeRequest = z.infer<typeof ControlSwitchModeRequestSchema>;

// ============================================================================
// Permission Category - Tool Permission Approval
// ============================================================================

/**
 * Permission decision options
 */
export const PermissionDecisionSchema = z.enum([
  'approved',             // One-time approval
  'approved_for_session', // Approve and remember for this session
  'denied',               // One-time denial
  'abort',                // Abort current operation
]);

export type PermissionDecision = z.infer<typeof PermissionDecisionSchema>;

/**
 * Permission mode options
 */
export const PermissionModeSchema = z.enum([
  'default',
  'acceptEdits',
  'bypassPermissions',
]);

export type PermissionModeType = z.infer<typeof PermissionModeSchema>;

/**
 * Parameters for permission.respond RPC request
 * Purpose: Respond to a tool permission request from the AI agent
 */
export const PermissionRespondRequestSchema = z.object({
  /** RPC method identifier */
  method: z.literal('permission.respond'),
  /** Target session ID */
  sessionId: z.string(),
  /** Request parameters */
  params: z.object({
    /** Unique ID of the permission request */
    id: z.string(),
    /** Whether the permission is approved */
    approved: z.boolean(),
    /** Optional reason for denial */
    reason: z.string().optional(),
    /** Optional permission mode to set */
    mode: PermissionModeSchema.optional(),
    /** Optional tools to add to allowed list (for "approve and remember") */
    allowTools: z.array(z.string()).optional(),
  }),
});

export type PermissionRespondRequest = z.infer<typeof PermissionRespondRequestSchema>;

// ============================================================================
// State Category - Session State Query
// ============================================================================

/**
 * Parameters for state.query RPC request
 * Purpose: Query the current state of the AI session
 */
export const StateQueryRequestSchema = z.object({
  /** RPC method identifier */
  method: z.literal('state.query'),
  /** Target session ID */
  sessionId: z.string(),
  /** Empty params object */
  params: z.object({}),
});

export type StateQueryRequest = z.infer<typeof StateQueryRequestSchema>;

/**
 * Response for state.query RPC method
 * Returns current session state information
 */
export const StateQueryResponseSchema = z.object({
  /** Whether the query succeeded */
  success: z.boolean(),
  /** Error message if query failed */
  error: z.string().optional(),
  /** Current session mode (local/remote) */
  mode: SessionModeSchema.optional(),
  /** Current execution state */
  state: ExecutionStateSchema.optional(),
  /** AI backend type */
  backend: BackendTypeSchema.optional(),
  /** Current model name (optional, e.g., for Gemini) */
  model: z.string().optional(),
  /** Currently executing tool name (if waiting for permission) */
  currentTool: z.string().optional(),
});

export type StateQueryResponse = z.infer<typeof StateQueryResponseSchema>;

// ============================================================================
// Union Types for Request/Response
// ============================================================================

/**
 * All RPC request types
 */
export const RpcRequestSchema = z.discriminatedUnion('method', [
  ControlPauseRequestSchema,
  ControlResumeRequestSchema,
  ControlTerminateRequestSchema,
  ControlSwitchModeRequestSchema,
  PermissionRespondRequestSchema,
  StateQueryRequestSchema,
]);

export type RpcRequest = z.infer<typeof RpcRequestSchema>;

/**
 * RPC method names
 */
export type RpcMethodName =
  | 'control.pause'
  | 'control.resume'
  | 'control.terminate'
  | 'control.switchMode'
  | 'permission.respond'
  | 'state.query';

// ============================================================================
// RPC Request/Response Container Types
// ============================================================================

/**
 * Container for RPC request sent over WebSocket
 */
export const RpcRequestContainerSchema = z.object({
  /** Request type identifier */
  type: z.literal('rpc-request'),
  /** Unique request ID for correlation */
  requestId: z.string(),
  /** Target session ID */
  sessionId: z.string(),
  /** RPC method name */
  method: z.string(),
  /** Method parameters */
  params: z.record(z.string(), z.unknown()),
  /** Request timestamp */
  timestamp: z.number(),
});

export type RpcRequestContainer = z.infer<typeof RpcRequestContainerSchema>;

/**
 * Container for RPC response received over WebSocket
 */
export const RpcResponseContainerSchema = z.object({
  /** Response type identifier */
  type: z.literal('rpc-response'),
  /** Request ID for correlation */
  requestId: z.string(),
  /** Whether the RPC call succeeded */
  success: z.boolean(),
  /** Error message if failed */
  error: z.string().optional(),
  /** Response data */
  data: z.record(z.string(), z.unknown()).optional(),
  /** Response timestamp */
  timestamp: z.number(),
});

export type RpcResponseContainer = z.infer<typeof RpcResponseContainerSchema>;

// ============================================================================
// Permission Request Event Types (Server → Mobile)
// ============================================================================

/**
 * Tool permission request event pushed from CLI via server to mobile
 */
export const PermissionRequestEventSchema = z.object({
  /** Event type identifier */
  type: z.literal('permission-request'),
  /** Session ID where permission is needed */
  sessionId: z.string(),
  /** Unique permission request ID */
  permissionId: z.string(),
  /** Tool name requesting permission */
  toolName: z.string(),
  /** Tool input/arguments description */
  toolInput: z.string().optional(),
  /** Request timestamp */
  timestamp: z.number(),
  /** Expiration timestamp (5 minutes from request) */
  expiresAt: z.number(),
});

export type PermissionRequestEvent = z.infer<typeof PermissionRequestEventSchema>;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Build a full RPC method name from session ID and method name
 * @param sessionId Session ID
 * @param method RPC method name
 * @returns Full method name like "abc123:control.pause"
 */
export function buildRpcMethodName(sessionId: string, method: RpcMethodName): string {
  return `${sessionId}:${method}`;
}

/**
 * Create an RPC request container
 * @param sessionId Target session ID
 * @param method RPC method name
 * @param params Method parameters
 * @returns RPC request container ready for sending
 */
export function createRpcRequest(
  sessionId: string,
  method: RpcMethodName,
  params: Record<string, unknown> = {}
): RpcRequestContainer {
  return {
    type: 'rpc-request',
    requestId: generateRequestId(),
    sessionId,
    method,
    params,
    timestamp: Date.now(),
  };
}

/**
 * Generate a unique request ID
 * @returns Unique request ID string
 */
function generateRequestId(): string {
  return `rpc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Validate an RPC response
 * @param response Response to validate
 * @returns Validated RPC response container or null if invalid
 */
export function validateRpcResponse(response: unknown): RpcResponseContainer | null {
  const result = RpcResponseContainerSchema.safeParse(response);
  return result.success ? result.data : null;
}

/**
 * Check if an RPC response indicates success
 * @param response RPC response container
 * @returns true if the response indicates success
 */
export function isRpcSuccess(response: RpcResponseContainer): boolean {
  return response.success === true;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for permission request events
 */
export function isPermissionRequestEvent(event: unknown): event is PermissionRequestEvent {
  return PermissionRequestEventSchema.safeParse(event).success;
}

/**
 * Type guard for RPC response containers
 */
export function isRpcResponseContainer(data: unknown): data is RpcResponseContainer {
  return RpcResponseContainerSchema.safeParse(data).success;
}
