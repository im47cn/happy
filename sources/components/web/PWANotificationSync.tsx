/**
 * @file PWA 通知状态同步组件
 * @input @/pwa/useNotificationSync
 * @output 无渲染输出，仅执行同步逻辑
 * @pos 在 Web 平台同步跨设备通知状态，当审批请求被处理时自动关闭对应通知
 *
 * 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的 CLAUDE.md。
 */

import { useEffect } from "react";
import { Platform } from "react-native";
import {
    useNotificationSync,
    syncBadgeWithPendingRequests,
} from "@/pwa";

/**
 * PWA Notification Sync Component
 *
 * This component handles cross-device notification state synchronization.
 * When approval requests are processed on one device, notifications are
 * automatically closed on all devices.
 *
 * Features:
 * - Watches agentState for completed requests
 * - Closes notifications for completed requests
 * - Syncs badge count with pending request count
 *
 * Usage:
 * ```tsx
 * // In your app layout
 * <PWANotificationSync />
 * ```
 */
export function PWANotificationSync(): null {
    // Skip on non-web platforms
    if (Platform.OS !== "web") {
        return null;
    }

    // Use the notification sync hook
    useNotificationSync();

    // Sync badge on mount
    useEffect(() => {
        // Delay slightly to ensure storage is ready
        const timer = setTimeout(() => {
            syncBadgeWithPendingRequests();
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    return null;
}
