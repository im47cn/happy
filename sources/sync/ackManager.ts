/**
 * input: apiSocket for WebSocket communication
 * output: Reliable message delivery with ACK confirmation and retry
 * pos: Core reliability layer for message transmission
 *
 * 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的CLAUDE.md。
 */

import { EventEmitter } from 'events';

// ACK response from server
export interface AckResponse {
    result: 'ok' | 'error';
    localId: string | null;
    messageId?: string;
    duplicate?: boolean;
    error?: string;
}

// Pending message in the queue
interface PendingMessage {
    localId: string;
    sessionId: string;
    data: any;
    createdAt: number;
    retryCount: number;
    timeoutId: ReturnType<typeof setTimeout> | null;
    resolve: (response: AckResponse) => void;
    reject: (error: Error) => void;
}

// Configuration
const ACK_TIMEOUT_MS = 5000;      // 5 seconds timeout
const MAX_RETRIES = 3;            // Maximum retry attempts

/**
 * ACK Manager - handles message confirmation and retry logic
 *
 * Features:
 * - Tracks pending messages awaiting ACK
 * - Automatic retry on timeout (up to 3 times)
 * - Deduplication via localId
 * - Event emission for status updates
 */
export class AckManager extends EventEmitter {
    private pendingMessages: Map<string, PendingMessage> = new Map();
    private emitWithAck: <T = any>(event: string, data: any) => Promise<T>;

    constructor(emitWithAck: <T = any>(event: string, data: any) => Promise<T>) {
        super();
        this.emitWithAck = emitWithAck;
    }

    /**
     * Send a message with ACK confirmation
     * Returns a promise that resolves when ACK is received or rejects after max retries
     */
    async sendWithAck(
        sessionId: string,
        localId: string,
        messageData: any
    ): Promise<AckResponse> {
        // Check for duplicate pending message
        if (this.pendingMessages.has(localId)) {
            throw new Error(`Message ${localId} is already pending`);
        }

        return new Promise((resolve, reject) => {
            const pending: PendingMessage = {
                localId,
                sessionId,
                data: messageData,
                createdAt: Date.now(),
                retryCount: 0,
                timeoutId: null,
                resolve,
                reject
            };

            this.pendingMessages.set(localId, pending);
            this.emit('message-pending', { localId, sessionId });

            // Start sending with retry logic
            this.attemptSend(pending);
        });
    }

    /**
     * Attempt to send a message, with timeout and retry handling
     */
    private async attemptSend(pending: PendingMessage): Promise<void> {
        const { localId, data } = pending;

        // Clear any existing timeout
        if (pending.timeoutId) {
            clearTimeout(pending.timeoutId);
            pending.timeoutId = null;
        }

        try {
            // Emit sending status
            this.emit('message-sending', { localId, retryCount: pending.retryCount });

            // Send with ACK using emitWithAck
            const response = await Promise.race([
                this.emitWithAck<AckResponse>('message', data),
                this.createTimeout(localId, ACK_TIMEOUT_MS)
            ]);

            // ACK received successfully
            this.handleAckReceived(localId, response);
        } catch (error) {
            // Timeout or error - handle retry
            this.handleSendFailure(pending, error as Error);
        }
    }

    /**
     * Create a timeout promise that rejects after specified time
     */
    private createTimeout(localId: string, ms: number): Promise<never> {
        return new Promise((_, reject) => {
            const pending = this.pendingMessages.get(localId);
            if (pending) {
                pending.timeoutId = setTimeout(() => {
                    reject(new Error('ACK_TIMEOUT'));
                }, ms);
            }
        });
    }

    /**
     * Handle successful ACK response
     */
    private handleAckReceived(localId: string, response: AckResponse): void {
        const pending = this.pendingMessages.get(localId);
        if (!pending) return;

        // Clear timeout
        if (pending.timeoutId) {
            clearTimeout(pending.timeoutId);
        }

        // Remove from pending
        this.pendingMessages.delete(localId);

        if (response.result === 'ok') {
            this.emit('message-acked', {
                localId,
                messageId: response.messageId,
                duplicate: response.duplicate
            });
            pending.resolve(response);
        } else {
            this.emit('message-error', {
                localId,
                error: response.error || 'Unknown error'
            });
            pending.reject(new Error(response.error || 'Server error'));
        }
    }

    /**
     * Handle send failure - retry or give up
     */
    private handleSendFailure(pending: PendingMessage, error: Error): void {
        const { localId } = pending;
        pending.retryCount++;

        if (pending.retryCount < MAX_RETRIES) {
            // Retry
            this.emit('message-retry', {
                localId,
                retryCount: pending.retryCount,
                maxRetries: MAX_RETRIES
            });

            // Exponential backoff: 1s, 2s, 4s
            const backoffMs = Math.pow(2, pending.retryCount - 1) * 1000;
            setTimeout(() => {
                if (this.pendingMessages.has(localId)) {
                    this.attemptSend(pending);
                }
            }, backoffMs);
        } else {
            // Max retries reached - give up
            if (pending.timeoutId) {
                clearTimeout(pending.timeoutId);
            }
            this.pendingMessages.delete(localId);

            this.emit('message-failed', {
                localId,
                error: `Failed after ${MAX_RETRIES} retries: ${error.message}`
            });
            pending.reject(new Error(`Message delivery failed after ${MAX_RETRIES} retries`));
        }
    }

    /**
     * Cancel a pending message
     */
    cancel(localId: string): boolean {
        const pending = this.pendingMessages.get(localId);
        if (!pending) return false;

        if (pending.timeoutId) {
            clearTimeout(pending.timeoutId);
        }
        this.pendingMessages.delete(localId);
        pending.reject(new Error('Message cancelled'));

        this.emit('message-cancelled', { localId });
        return true;
    }

    /**
     * Get all pending message IDs
     */
    getPendingIds(): string[] {
        return Array.from(this.pendingMessages.keys());
    }

    /**
     * Check if a message is pending
     */
    isPending(localId: string): boolean {
        return this.pendingMessages.has(localId);
    }

    /**
     * Get pending message count
     */
    getPendingCount(): number {
        return this.pendingMessages.size;
    }

    /**
     * Clear all pending messages (e.g., on disconnect)
     */
    clearAll(): void {
        for (const [localId, pending] of this.pendingMessages) {
            if (pending.timeoutId) {
                clearTimeout(pending.timeoutId);
            }
            pending.reject(new Error('Connection closed'));
        }
        this.pendingMessages.clear();
        this.emit('all-cleared');
    }
}

// Singleton instance placeholder - will be initialized by sync module
let ackManagerInstance: AckManager | null = null;

export function initAckManager(emitWithAck: <T = any>(event: string, data: any) => Promise<T>): AckManager {
    ackManagerInstance = new AckManager(emitWithAck);
    return ackManagerInstance;
}

export function getAckManager(): AckManager | null {
    return ackManagerInstance;
}

export function destroyAckManager(): void {
    if (ackManagerInstance) {
        ackManagerInstance.clearAll();
        ackManagerInstance = null;
    }
}
