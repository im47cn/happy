/**
 * @file 跨设备通知状态同步 Hook
 * @input Session agentState（来自 Zustand storage）
 * @output 当审批请求被处理后自动关闭对应通知，同步 badge 数量
 * @pos PWA 通知生命周期管理，实现跨设备通知状态同步
 *
 * 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的 CLAUDE.md。
 */

import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { storage } from "../sync/storage";
import { closeNotifications, setBadge, isServiceWorkerSupported } from "./serviceWorker";
import type { Session } from "../sync/storageTypes";

// ============================================================================
// Types
// ============================================================================

interface AgentStateRequests {
    [id: string]: {
        tool: string;
        arguments: unknown;
        createdAt: number;
    };
}

interface AgentStateCompletedRequests {
    [id: string]: {
        tool: string;
        arguments: unknown;
        createdAt: number;
        completedAt: number;
        status: "canceled" | "denied" | "approved";
        reason?: string;
    };
}

interface AgentState {
    requests?: AgentStateRequests;
    completedRequests?: AgentStateCompletedRequests;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to synchronize notification state across devices
 *
 * When agentState changes and requests move to completedRequests,
 * this hook automatically closes the corresponding notifications
 * and updates the badge count.
 *
 * Usage:
 * ```tsx
 * function App() {
 *     useNotificationSync();
 *     return <YourApp />;
 * }
 * ```
 */
export function useNotificationSync(): void {
    // Skip on non-web platforms
    if (Platform.OS !== "web") {
        return;
    }

    // Track previous request IDs per session
    const prevRequestIdsRef = useRef<Map<string, Set<string>>>(new Map());

    useEffect(() => {
        // Check if Service Worker is supported
        if (!isServiceWorkerSupported()) {
            return;
        }

        // Subscribe to storage changes
        const unsubscribe = storage.subscribe((state, prevState) => {
            // Collect all current pending request IDs across all sessions
            const allCurrentRequestIds = new Set<string>();
            const newlyCompletedRequestIds: string[] = [];

            // Process each session
            Object.entries(state.sessions).forEach(([sessionId, session]) => {
                const agentState = (session as Session).agentState as AgentState | undefined;
                const prevSession = prevState.sessions[sessionId] as Session | undefined;
                const prevAgentState = prevSession?.agentState as AgentState | undefined;

                // Get current and previous request IDs for this session
                const currentRequestIds = new Set(Object.keys(agentState?.requests || {}));
                const prevRequestIds = prevRequestIdsRef.current.get(sessionId) || new Set();

                // Add current request IDs to total count
                currentRequestIds.forEach((id) => allCurrentRequestIds.add(id));

                // Find requests that were pending but are now gone (completed)
                prevRequestIds.forEach((requestId) => {
                    if (!currentRequestIds.has(requestId)) {
                        // Check if it moved to completedRequests
                        const completedRequest = agentState?.completedRequests?.[requestId];
                        if (completedRequest) {
                            newlyCompletedRequestIds.push(requestId);
                        }
                    }
                });

                // Also check for completedRequests that weren't in previous state
                // This handles the case where we receive the completion from another device
                const prevCompletedIds = new Set(Object.keys(prevAgentState?.completedRequests || {}));
                const currentCompletedIds = Object.keys(agentState?.completedRequests || {});

                currentCompletedIds.forEach((requestId) => {
                    if (!prevCompletedIds.has(requestId) && !newlyCompletedRequestIds.includes(requestId)) {
                        newlyCompletedRequestIds.push(requestId);
                    }
                });

                // Update previous request IDs for next comparison
                prevRequestIdsRef.current.set(sessionId, currentRequestIds);
            });

            // Close notifications for completed requests
            if (newlyCompletedRequestIds.length > 0) {
                console.log("[PWA] Closing notifications for completed requests:", newlyCompletedRequestIds);
                closeNotifications({ requestIds: newlyCompletedRequestIds });
            }

            // Update badge count based on total pending requests
            const badgeCount = allCurrentRequestIds.size;
            const prevBadgeCount = calculatePrevBadgeCount(prevState.sessions);

            if (badgeCount !== prevBadgeCount) {
                console.log("[PWA] Updating badge count:", badgeCount);
                setBadge(badgeCount);
            }
        });

        return () => {
            unsubscribe();
        };
    }, []);
}

/**
 * Calculate total pending request count from sessions
 */
function calculatePrevBadgeCount(sessions: Record<string, Session>): number {
    let count = 0;
    Object.values(sessions).forEach((session) => {
        const agentState = session.agentState as AgentState | undefined;
        count += Object.keys(agentState?.requests || {}).length;
    });
    return count;
}

/**
 * Get current pending request count across all sessions
 * Useful for initial badge count setup
 */
export function getPendingRequestCount(): number {
    const state = storage.getState();
    return calculatePrevBadgeCount(state.sessions);
}

/**
 * Sync badge count with current pending requests
 * Call this on app startup to ensure badge is accurate
 */
export function syncBadgeWithPendingRequests(): void {
    if (Platform.OS !== "web" || !isServiceWorkerSupported()) {
        return;
    }

    const count = getPendingRequestCount();
    console.log("[PWA] Syncing badge with pending requests:", count);
    setBadge(count);
}
