/**
 * input: MMKV storage, session messages, pending operations
 * output: Offline cache management with LRU eviction and sync support
 * pos: Core offline capability for network interruption resilience
 *
 * 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的CLAUDE.md。
 */

import { MMKV } from 'react-native-mmkv';
import { Message } from './typesMessage';

// Constants
const MAX_MESSAGES_PER_SESSION = 100;
const MAX_TOTAL_CACHE_SIZE_BYTES = 100 * 1024 * 1024; // 100MB
const CACHE_PREFIX = 'offline:';
const MESSAGES_KEY = (sessionId: string) => `${CACHE_PREFIX}session:${sessionId}:messages`;
const PENDING_KEY = (sessionId: string) => `${CACHE_PREFIX}session:${sessionId}:pending`;
const METADATA_KEY = (sessionId: string) => `${CACHE_PREFIX}session:${sessionId}:metadata`;
const LRU_KEY = `${CACHE_PREFIX}lru`;
const SIZE_KEY = `${CACHE_PREFIX}total_size`;

// Pending operation types
export interface PendingOperation {
    id: string;
    type: 'command' | 'state_update' | 'permission_response';
    sessionId: string;
    data: any;
    createdAt: number;
    retryCount: number;
}

// Cached session metadata
export interface CachedSessionMetadata {
    sessionId: string;
    mode: 'local' | 'remote';
    backend: 'claude' | 'codex' | 'gemini' | 'opencode';
    model?: string;
    executionState?: 'idle' | 'thinking' | 'waiting' | 'paused';
    currentTool?: string | null;
    path?: string;
    lastUpdated: number;
}

// LRU entry for cache management
interface LruEntry {
    sessionId: string;
    lastAccessed: number;
    size: number;
}

// Create dedicated MMKV instance for offline cache
const cacheStorage = new MMKV({ id: 'offline-cache' });

/**
 * Offline Cache Manager
 * Provides persistent storage for offline operation with automatic cleanup
 */
class OfflineCacheManager {
    private lruMap: Map<string, LruEntry> = new Map();
    private totalSize: number = 0;

    constructor() {
        this.loadLruState();
    }

    /**
     * Load LRU state from storage
     */
    private loadLruState(): void {
        try {
            const lruData = cacheStorage.getString(LRU_KEY);
            if (lruData) {
                const entries: LruEntry[] = JSON.parse(lruData);
                this.lruMap.clear();
                for (const entry of entries) {
                    this.lruMap.set(entry.sessionId, entry);
                }
            }
            const sizeData = cacheStorage.getString(SIZE_KEY);
            if (sizeData) {
                this.totalSize = parseInt(sizeData, 10) || 0;
            }
        } catch (e) {
            console.error('[OfflineCache] Failed to load LRU state:', e);
            this.lruMap.clear();
            this.totalSize = 0;
        }
    }

    /**
     * Save LRU state to storage
     */
    private saveLruState(): void {
        try {
            const entries = Array.from(this.lruMap.values());
            cacheStorage.set(LRU_KEY, JSON.stringify(entries));
            cacheStorage.set(SIZE_KEY, this.totalSize.toString());
        } catch (e) {
            console.error('[OfflineCache] Failed to save LRU state:', e);
        }
    }

    /**
     * Update LRU access time for a session
     */
    private touchSession(sessionId: string, newSize?: number): void {
        const existing = this.lruMap.get(sessionId);
        const size = newSize ?? existing?.size ?? 0;
        this.lruMap.set(sessionId, {
            sessionId,
            lastAccessed: Date.now(),
            size
        });
    }

    /**
     * Evict old sessions if total cache exceeds limit
     */
    private evictIfNeeded(): void {
        if (this.totalSize <= MAX_TOTAL_CACHE_SIZE_BYTES) return;

        // Sort by last accessed (oldest first)
        const sessions = Array.from(this.lruMap.values())
            .sort((a, b) => a.lastAccessed - b.lastAccessed);

        for (const session of sessions) {
            if (this.totalSize <= MAX_TOTAL_CACHE_SIZE_BYTES * 0.8) break; // Keep 80% threshold

            this.clearSessionCache(session.sessionId);
            console.log(`[OfflineCache] Evicted session ${session.sessionId} (LRU)`);
        }
    }

    // ==================== Messages ====================

    /**
     * Cache messages for a session
     */
    cacheMessages(sessionId: string, messages: Message[]): void {
        try {
            // Limit to most recent MAX_MESSAGES_PER_SESSION
            const recentMessages = messages.slice(-MAX_MESSAGES_PER_SESSION);

            const key = MESSAGES_KEY(sessionId);
            const oldData = cacheStorage.getString(key);
            const oldSize = oldData ? oldData.length * 2 : 0;

            const data = JSON.stringify(recentMessages);
            const newSize = data.length * 2;

            cacheStorage.set(key, data);

            // Update size tracking
            this.totalSize = this.totalSize - oldSize + newSize;
            this.touchSession(sessionId, (this.lruMap.get(sessionId)?.size ?? 0) - oldSize + newSize);

            this.evictIfNeeded();
            this.saveLruState();
        } catch (e) {
            console.error('[OfflineCache] Failed to cache messages:', e);
        }
    }

    /**
     * Append new messages to cache
     */
    appendMessages(sessionId: string, newMessages: Message[]): void {
        try {
            const existing = this.getCachedMessages(sessionId);
            const combined = [...existing, ...newMessages];
            this.cacheMessages(sessionId, combined);
        } catch (e) {
            console.error('[OfflineCache] Failed to append messages:', e);
        }
    }

    /**
     * Get cached messages for a session
     */
    getCachedMessages(sessionId: string): Message[] {
        try {
            const key = MESSAGES_KEY(sessionId);
            const data = cacheStorage.getString(key);
            if (data) {
                this.touchSession(sessionId);
                this.saveLruState();
                return JSON.parse(data);
            }
        } catch (e) {
            console.error('[OfflineCache] Failed to get cached messages:', e);
        }
        return [];
    }

    // ==================== Pending Operations ====================

    /**
     * Add a pending operation to cache
     */
    addPendingOperation(operation: PendingOperation): void {
        try {
            const key = PENDING_KEY(operation.sessionId);
            const existing = this.getPendingOperations(operation.sessionId);

            // Prevent duplicates
            const filtered = existing.filter(op => op.id !== operation.id);
            filtered.push(operation);

            const oldData = cacheStorage.getString(key);
            const oldSize = oldData ? oldData.length * 2 : 0;

            const data = JSON.stringify(filtered);
            const newSize = data.length * 2;

            cacheStorage.set(key, data);

            this.totalSize = this.totalSize - oldSize + newSize;
            this.touchSession(operation.sessionId);
            this.saveLruState();
        } catch (e) {
            console.error('[OfflineCache] Failed to add pending operation:', e);
        }
    }

    /**
     * Remove a pending operation after successful sync
     */
    removePendingOperation(sessionId: string, operationId: string): void {
        try {
            const key = PENDING_KEY(sessionId);
            const existing = this.getPendingOperations(sessionId);
            const filtered = existing.filter(op => op.id !== operationId);

            if (filtered.length === 0) {
                cacheStorage.delete(key);
            } else {
                cacheStorage.set(key, JSON.stringify(filtered));
            }

            this.touchSession(sessionId);
            this.saveLruState();
        } catch (e) {
            console.error('[OfflineCache] Failed to remove pending operation:', e);
        }
    }

    /**
     * Get all pending operations for a session
     */
    getPendingOperations(sessionId: string): PendingOperation[] {
        try {
            const key = PENDING_KEY(sessionId);
            const data = cacheStorage.getString(key);
            if (data) {
                return JSON.parse(data);
            }
        } catch (e) {
            console.error('[OfflineCache] Failed to get pending operations:', e);
        }
        return [];
    }

    /**
     * Get all pending operations across all sessions
     */
    getAllPendingOperations(): PendingOperation[] {
        const allOperations: PendingOperation[] = [];
        try {
            const keys = cacheStorage.getAllKeys();
            for (const key of keys) {
                if (key.includes(':pending')) {
                    const data = cacheStorage.getString(key);
                    if (data) {
                        const operations: PendingOperation[] = JSON.parse(data);
                        allOperations.push(...operations);
                    }
                }
            }
        } catch (e) {
            console.error('[OfflineCache] Failed to get all pending operations:', e);
        }
        return allOperations.sort((a, b) => a.createdAt - b.createdAt);
    }

    /**
     * Update retry count for a pending operation
     */
    updatePendingRetryCount(sessionId: string, operationId: string): void {
        try {
            const operations = this.getPendingOperations(sessionId);
            const updated = operations.map(op => {
                if (op.id === operationId) {
                    return { ...op, retryCount: op.retryCount + 1 };
                }
                return op;
            });
            cacheStorage.set(PENDING_KEY(sessionId), JSON.stringify(updated));
        } catch (e) {
            console.error('[OfflineCache] Failed to update retry count:', e);
        }
    }

    // ==================== Session Metadata ====================

    /**
     * Cache session metadata
     */
    cacheSessionMetadata(metadata: CachedSessionMetadata): void {
        try {
            const key = METADATA_KEY(metadata.sessionId);
            const data = JSON.stringify({ ...metadata, lastUpdated: Date.now() });
            cacheStorage.set(key, data);
            this.touchSession(metadata.sessionId);
            this.saveLruState();
        } catch (e) {
            console.error('[OfflineCache] Failed to cache session metadata:', e);
        }
    }

    /**
     * Get cached session metadata
     */
    getCachedSessionMetadata(sessionId: string): CachedSessionMetadata | null {
        try {
            const key = METADATA_KEY(sessionId);
            const data = cacheStorage.getString(key);
            if (data) {
                this.touchSession(sessionId);
                this.saveLruState();
                return JSON.parse(data);
            }
        } catch (e) {
            console.error('[OfflineCache] Failed to get session metadata:', e);
        }
        return null;
    }

    // ==================== Cache Management ====================

    /**
     * Clear all cache for a specific session
     */
    clearSessionCache(sessionId: string): void {
        try {
            const messagesKey = MESSAGES_KEY(sessionId);
            const pendingKey = PENDING_KEY(sessionId);
            const metadataKey = METADATA_KEY(sessionId);

            // Calculate size being removed
            let removedSize = 0;
            const messagesData = cacheStorage.getString(messagesKey);
            if (messagesData) removedSize += messagesData.length * 2;
            const pendingData = cacheStorage.getString(pendingKey);
            if (pendingData) removedSize += pendingData.length * 2;
            const metadataData = cacheStorage.getString(metadataKey);
            if (metadataData) removedSize += metadataData.length * 2;

            cacheStorage.delete(messagesKey);
            cacheStorage.delete(pendingKey);
            cacheStorage.delete(metadataKey);

            this.totalSize -= removedSize;
            this.lruMap.delete(sessionId);
            this.saveLruState();
        } catch (e) {
            console.error('[OfflineCache] Failed to clear session cache:', e);
        }
    }

    /**
     * Clear all offline cache
     */
    clearAllCache(): void {
        try {
            const keys = cacheStorage.getAllKeys();
            for (const key of keys) {
                if (key.startsWith(CACHE_PREFIX)) {
                    cacheStorage.delete(key);
                }
            }
            this.lruMap.clear();
            this.totalSize = 0;
            this.saveLruState();
        } catch (e) {
            console.error('[OfflineCache] Failed to clear all cache:', e);
        }
    }

    /**
     * Get cache statistics
     */
    getCacheStats(): {
        totalSizeBytes: number;
        sessionCount: number;
        pendingOperationCount: number;
    } {
        const pendingOperationCount = this.getAllPendingOperations().length;
        return {
            totalSizeBytes: this.totalSize,
            sessionCount: this.lruMap.size,
            pendingOperationCount
        };
    }

    /**
     * Check if there are pending operations that need sync
     */
    hasPendingSync(): boolean {
        return this.getAllPendingOperations().length > 0;
    }
}

// Singleton instance
let cacheManagerInstance: OfflineCacheManager | null = null;

export function getOfflineCache(): OfflineCacheManager {
    if (!cacheManagerInstance) {
        cacheManagerInstance = new OfflineCacheManager();
    }
    return cacheManagerInstance;
}

export function resetOfflineCache(): void {
    if (cacheManagerInstance) {
        cacheManagerInstance.clearAllCache();
    }
    cacheManagerInstance = null;
}

// Convenience functions for common operations
export const offlineCache = {
    // Messages
    cacheMessages: (sessionId: string, messages: Message[]) =>
        getOfflineCache().cacheMessages(sessionId, messages),
    appendMessages: (sessionId: string, messages: Message[]) =>
        getOfflineCache().appendMessages(sessionId, messages),
    getCachedMessages: (sessionId: string) =>
        getOfflineCache().getCachedMessages(sessionId),

    // Pending operations
    addPending: (operation: PendingOperation) =>
        getOfflineCache().addPendingOperation(operation),
    removePending: (sessionId: string, operationId: string) =>
        getOfflineCache().removePendingOperation(sessionId, operationId),
    getPending: (sessionId: string) =>
        getOfflineCache().getPendingOperations(sessionId),
    getAllPending: () =>
        getOfflineCache().getAllPendingOperations(),

    // Metadata
    cacheMetadata: (metadata: CachedSessionMetadata) =>
        getOfflineCache().cacheSessionMetadata(metadata),
    getMetadata: (sessionId: string) =>
        getOfflineCache().getCachedSessionMetadata(sessionId),

    // Management
    clearSession: (sessionId: string) =>
        getOfflineCache().clearSessionCache(sessionId),
    clearAll: () =>
        getOfflineCache().clearAllCache(),
    getStats: () =>
        getOfflineCache().getCacheStats(),
    hasPendingSync: () =>
        getOfflineCache().hasPendingSync()
};
