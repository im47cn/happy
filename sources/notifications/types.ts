/**
 * @file Native Push Notification Types
 * @input None
 * @output TypeScript types for native push notifications (iOS/Android)
 * @pos Type definitions for expo-notifications integration
 *
 * 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的 CLAUDE.md。
 */

import type { NotificationPayload, NotificationData, NotificationPreferences } from '@/pwa/types';

// Re-export shared types from PWA module
export type {
    Platform,
    NotificationType,
    Urgency,
    NotificationPayload,
    NotificationData,
    NotificationPreferences,
} from '@/pwa/types';
export { DEFAULT_NOTIFICATION_PREFERENCES } from '@/pwa/types';

// ============================================================================
// Native-specific Types
// ============================================================================

/**
 * Expo Push Token type
 */
export interface ExpoPushToken {
    type: 'expo';
    data: string;  // ExpoPushToken string (e.g., "ExponentPushToken[xxx]")
}

/**
 * Device Push Token type (APNs or FCM)
 */
export interface DevicePushToken {
    type: 'ios' | 'android';
    data: string;  // Native token from APNs/FCM
}

/**
 * Combined push token type
 */
export type PushToken = ExpoPushToken | DevicePushToken;

/**
 * Native notification permission status
 */
export type NativePermissionStatus =
    | 'undetermined'  // User hasn't been asked yet
    | 'granted'       // User granted permission
    | 'denied'        // User denied permission
    | 'ephemeral';    // iOS provisional authorization (quiet notifications)

/**
 * Native subscription status
 */
export interface NativeSubscriptionStatus {
    permissionStatus: NativePermissionStatus;
    pushToken: PushToken | null;
    deviceId: string | null;
    subscriptionId: string | null;
    isRegistered: boolean;
}

/**
 * Native notification settings (iOS)
 */
export interface IOSNotificationSettings {
    alertStyle: 'none' | 'banner' | 'alert';
    allowsSound: boolean;
    allowsBadge: boolean;
    allowsAlert: boolean;
    allowsCriticalAlerts: boolean;
    providesAppNotificationSettings: boolean;
    showPreviews: 'never' | 'whenUnlocked' | 'always';
}

/**
 * Android notification channel
 */
export interface AndroidNotificationChannel {
    id: string;
    name: string;
    importance: 1 | 2 | 3 | 4 | 5;  // IMPORTANCE_MIN to IMPORTANCE_HIGH
    description?: string;
    sound?: string;
    vibrationPattern?: number[];
    lightColor?: string;
    bypassDnd?: boolean;
    lockscreenVisibility?: -1 | 0 | 1;  // VISIBILITY_SECRET/PRIVATE/PUBLIC
}

/**
 * Approval notification content
 * Used for remote approval requests from CLI
 */
export interface ApprovalNotification {
    approvalId: string;
    sessionId: string;
    operationType: string;
    riskLevel: 'low' | 'medium' | 'high';
    deadline: number;
    encryptedParams?: string;
}

/**
 * Native notification handler response
 */
export type NotificationHandlerResponse = {
    shouldShowAlert: boolean;
    shouldPlaySound: boolean;
    shouldSetBadge: boolean;
    priority?: 'default' | 'high' | 'max';
};

/**
 * Notification action identifiers
 */
export type NotificationActionId =
    | 'APPROVE'
    | 'REJECT'
    | 'VIEW_DETAILS'
    | 'DISMISS'
    | 'OPEN_SESSION';

/**
 * Notification action
 */
export interface NotificationAction {
    actionId: NotificationActionId;
    title: string;
    options?: {
        opensAppToForeground?: boolean;
        isDestructive?: boolean;
        isAuthenticationRequired?: boolean;
    };
}

/**
 * Notification category for grouping actions
 */
export interface NotificationCategory {
    identifier: string;
    actions: NotificationAction[];
    options?: {
        allowInCarPlay?: boolean;
        customDismissAction?: boolean;
        previewPlaceholder?: string;
    };
}

/**
 * Native subscription request (to server)
 */
export interface NativeSubscribeRequest {
    deviceId: string;
    platform: 'ios' | 'android';
    pushToken: string;
    tokenType: 'expo' | 'native';
    encryptedPreferences?: string;
}

/**
 * Native subscription response (from server)
 */
export interface NativeSubscribeResponse {
    success: boolean;
    subscriptionId?: string;
    error?: string;
}
