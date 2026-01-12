/**
 * @file Native Push Notification Service
 * @input expo-notifications, expo-device, TokenStorage, serverConfig
 * @output Push subscription management for iOS/Android
 * @pos Core service for native push notifications using expo-notifications
 *
 * 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的 CLAUDE.md。
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import type {
    NativePermissionStatus,
    NativeSubscriptionStatus,
    PushToken,
    NotificationCategory,
    NativeSubscribeRequest,
    NativeSubscribeResponse,
    AndroidNotificationChannel,
} from './types';
import { getServerUrl } from '@/sync/serverConfig';
import { TokenStorage } from '@/auth/tokenStorage';
import { log } from '@/log';

// ============================================================================
// Configuration
// ============================================================================

/**
 * Default notification handler configuration
 * Controls how notifications are displayed when app is in foreground
 */
Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
        const data = notification.request.content.data;

        // Always show approval requests prominently
        if (data?.type === 'approval_request') {
            return {
                shouldShowAlert: true,
                shouldShowBanner: true,
                shouldShowList: true,
                shouldPlaySound: true,
                shouldSetBadge: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
            };
        }

        // Default behavior for other notifications
        return {
            shouldShowAlert: true,
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
        };
    },
});

// ============================================================================
// Device ID Management
// ============================================================================

const DEVICE_ID_KEY = 'happy-native-device-id';
let cachedDeviceId: string | null = null;

/**
 * Generate UUID v4
 */
function generateUUID(): string {
    const bytes = new Uint8Array(16);
    // Use crypto API for random bytes
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(bytes);
    } else {
        // Fallback: Math.random (less secure but works everywhere)
        for (let i = 0; i < 16; i++) {
            bytes[i] = Math.floor(Math.random() * 256);
        }
    }

    // Set version (4) and variant bits
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Get or generate device ID
 * Device ID is used to uniquely identify this device
 */
export async function getDeviceId(): Promise<string> {
    if (cachedDeviceId) {
        return cachedDeviceId;
    }

    try {
        // Try to get from SecureStore
        const stored = await SecureStore.getItemAsync(DEVICE_ID_KEY);
        if (stored) {
            cachedDeviceId = stored;
            return stored;
        }

        // Generate new UUID
        const newId = generateUUID();
        await SecureStore.setItemAsync(DEVICE_ID_KEY, newId);
        cachedDeviceId = newId;

        log.log(`[push-service] Generated new device ID: ${newId}`);
        return newId;
    } catch (error) {
        // Fallback to in-memory UUID if SecureStore fails
        const fallbackId = generateUUID();
        cachedDeviceId = fallbackId;
        log.log(`[push-service] Using fallback device ID: ${fallbackId}`);
        return fallbackId;
    }
}

// ============================================================================
// Android Notification Channels
// ============================================================================

/**
 * Default notification channels for Android
 */
export const NOTIFICATION_CHANNELS: AndroidNotificationChannel[] = [
    {
        id: 'approval_requests',
        name: 'Approval Requests',
        importance: 4, // IMPORTANCE_HIGH
        description: 'Critical approval requests from CLI sessions',
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        bypassDnd: true,
        lockscreenVisibility: 1, // PUBLIC
    },
    {
        id: 'task_notifications',
        name: 'Task Notifications',
        importance: 3, // IMPORTANCE_DEFAULT
        description: 'Task completion and progress updates',
        sound: 'default',
    },
    {
        id: 'messages',
        name: 'Messages',
        importance: 3,
        description: 'New message notifications',
        sound: 'default',
    },
    {
        id: 'system',
        name: 'System',
        importance: 2, // IMPORTANCE_LOW
        description: 'System announcements and updates',
    },
];

/**
 * Setup Android notification channels
 * Must be called before any notifications are sent
 */
export async function setupAndroidChannels(): Promise<void> {
    if (Platform.OS !== 'android') return;

    for (const channel of NOTIFICATION_CHANNELS) {
        await Notifications.setNotificationChannelAsync(channel.id, {
            name: channel.name,
            importance: channel.importance as Notifications.AndroidImportance,
            description: channel.description,
            sound: channel.sound,
            vibrationPattern: channel.vibrationPattern,
            lightColor: channel.lightColor,
            bypassDnd: channel.bypassDnd,
            lockscreenVisibility: channel.lockscreenVisibility as Notifications.AndroidNotificationVisibility,
        });
    }

    log.log('[push-service] Android notification channels configured');
}

// ============================================================================
// Notification Categories (iOS Action Buttons)
// ============================================================================

/**
 * Default notification categories with action buttons
 */
export const NOTIFICATION_CATEGORIES: NotificationCategory[] = [
    {
        identifier: 'APPROVAL_REQUEST',
        actions: [
            {
                actionId: 'APPROVE',
                title: 'Approve',
                options: {
                    opensAppToForeground: false,
                    isAuthenticationRequired: true,
                },
            },
            {
                actionId: 'REJECT',
                title: 'Reject',
                options: {
                    opensAppToForeground: false,
                    isDestructive: true,
                },
            },
            {
                actionId: 'VIEW_DETAILS',
                title: 'View Details',
                options: {
                    opensAppToForeground: true,
                },
            },
        ],
        options: {
            previewPlaceholder: 'Approval request from CLI session',
        },
    },
    {
        identifier: 'TASK_COMPLETE',
        actions: [
            {
                actionId: 'OPEN_SESSION',
                title: 'Open Session',
                options: {
                    opensAppToForeground: true,
                },
            },
            {
                actionId: 'DISMISS',
                title: 'Dismiss',
                options: {
                    opensAppToForeground: false,
                },
            },
        ],
    },
];

/**
 * Setup notification categories
 */
export async function setupNotificationCategories(): Promise<void> {
    await Notifications.setNotificationCategoryAsync('APPROVAL_REQUEST', [
        {
            identifier: 'APPROVE',
            buttonTitle: 'Approve',
            options: {
                opensAppToForeground: false,
                isAuthenticationRequired: true,
            },
        },
        {
            identifier: 'REJECT',
            buttonTitle: 'Reject',
            options: {
                opensAppToForeground: false,
                isDestructive: true,
            },
        },
        {
            identifier: 'VIEW_DETAILS',
            buttonTitle: 'View Details',
            options: {
                opensAppToForeground: true,
            },
        },
    ]);

    await Notifications.setNotificationCategoryAsync('TASK_COMPLETE', [
        {
            identifier: 'OPEN_SESSION',
            buttonTitle: 'Open Session',
            options: {
                opensAppToForeground: true,
            },
        },
        {
            identifier: 'DISMISS',
            buttonTitle: 'Dismiss',
            options: {
                opensAppToForeground: false,
            },
        },
    ]);

    log.log('[push-service] Notification categories configured');
}

// ============================================================================
// Permission Management
// ============================================================================

/**
 * Get current notification permission status
 */
export async function getPermissionStatus(): Promise<NativePermissionStatus> {
    const { status } = await Notifications.getPermissionsAsync();

    switch (status) {
        case 'granted':
            return 'granted';
        case 'denied':
            return 'denied';
        case 'undetermined':
        default:
            return 'undetermined';
    }
}

/**
 * Request notification permission from user
 */
export async function requestPermission(): Promise<NativePermissionStatus> {
    if (!Device.isDevice) {
        log.log('[push-service] Push notifications require a physical device');
        return 'denied';
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();

    if (existingStatus === 'granted') {
        return 'granted';
    }

    const { status } = await Notifications.requestPermissionsAsync({
        ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowCriticalAlerts: true,
            provideAppNotificationSettings: true,
        },
        android: {},
    });

    log.log(`[push-service] Permission request result: ${status}`);

    switch (status) {
        case 'granted':
            return 'granted';
        case 'denied':
            return 'denied';
        default:
            return 'undetermined';
    }
}

// ============================================================================
// Push Token Management
// ============================================================================

/**
 * Get Expo push token
 */
export async function getExpoPushToken(): Promise<PushToken | null> {
    if (!Device.isDevice) {
        log.log('[push-service] Push notifications require a physical device');
        return null;
    }

    try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId ??
                          Constants.easConfig?.projectId;

        if (!projectId) {
            log.log('[push-service] No EAS project ID found');
            return null;
        }

        const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId,
        });

        log.log('[push-service] Expo push token obtained');

        return {
            type: 'expo',
            data: tokenData.data,
        };
    } catch (error) {
        log.log(`[push-service] Failed to get Expo push token: ${String(error)}`);
        return null;
    }
}

/**
 * Get native device push token (APNs for iOS, FCM for Android)
 */
export async function getDevicePushToken(): Promise<PushToken | null> {
    if (!Device.isDevice) {
        return null;
    }

    try {
        const tokenData = await Notifications.getDevicePushTokenAsync();

        log.log(`[push-service] Device push token obtained (${Platform.OS})`);

        return {
            type: Platform.OS === 'ios' ? 'ios' : 'android',
            data: tokenData.data as string,
        };
    } catch (error) {
        log.log(`[push-service] Failed to get device push token: ${String(error)}`);
        return null;
    }
}

// ============================================================================
// Server Registration
// ============================================================================

let _cachedSubscriptionId: string | null = null;

/**
 * Register push subscription with server
 */
export async function registerWithServer(token: PushToken): Promise<NativeSubscribeResponse> {
    const serverUrl = getServerUrl();
    const credentials = await TokenStorage.getCredentials();

    if (!credentials) {
        return { success: false, error: 'Not authenticated' };
    }

    const deviceId = await getDeviceId();

    const request: NativeSubscribeRequest = {
        deviceId,
        platform: Platform.OS === 'ios' ? 'ios' : 'android',
        pushToken: token.data,
        tokenType: token.type === 'expo' ? 'expo' : 'native',
    };

    try {
        const response = await fetch(`${serverUrl}/v1/push/native/subscribe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${credentials.token}`,
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            const error = await response.text();
            log.log(`[push-service] Server registration failed: ${response.status} - ${error}`);
            return { success: false, error };
        }

        const result = await response.json() as NativeSubscribeResponse;

        if (result.success && result.subscriptionId) {
            _cachedSubscriptionId = result.subscriptionId;
        }

        log.log(`[push-service] Server registration successful: ${result.subscriptionId}`);

        return result;
    } catch (error) {
        log.log(`[push-service] Server registration error: ${String(error)}`);
        return { success: false, error: String(error) };
    }
}

/**
 * Unregister push subscription from server
 */
export async function unregisterFromServer(): Promise<boolean> {
    const serverUrl = getServerUrl();
    const credentials = await TokenStorage.getCredentials();

    if (!credentials) {
        return false;
    }

    const deviceId = await getDeviceId();

    try {
        const response = await fetch(`${serverUrl}/v1/push/native/unsubscribe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${credentials.token}`,
            },
            body: JSON.stringify({ deviceId }),
        });

        if (response.ok) {
            _cachedSubscriptionId = null;
            log.log('[push-service] Server unregistration successful');
            return true;
        }

        return false;
    } catch (error) {
        log.log(`[push-service] Server unregistration error: ${String(error)}`);
        return false;
    }
}

// ============================================================================
// Subscription Status
// ============================================================================

/**
 * Get current subscription status
 */
export async function getSubscriptionStatus(): Promise<NativeSubscriptionStatus> {
    const permissionStatus = await getPermissionStatus();
    const deviceId = await getDeviceId();

    let pushToken: PushToken | null = null;

    if (permissionStatus === 'granted') {
        pushToken = await getExpoPushToken();
    }

    return {
        permissionStatus,
        pushToken,
        deviceId,
        subscriptionId: _cachedSubscriptionId,
        isRegistered: _cachedSubscriptionId !== null,
    };
}

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize push notification service
 * Should be called on app startup
 */
export async function initializePushService(): Promise<NativeSubscriptionStatus> {
    log.log('[push-service] Initializing push service');

    // Setup Android channels
    await setupAndroidChannels();

    // Setup notification categories
    await setupNotificationCategories();

    // Get current status
    const status = await getSubscriptionStatus();

    // Auto-register if permission is granted and not registered
    if (status.permissionStatus === 'granted' && status.pushToken && !status.isRegistered) {
        await registerWithServer(status.pushToken);
    }

    return await getSubscriptionStatus();
}

/**
 * Subscribe to push notifications (full flow)
 * Requests permission, gets token, and registers with server
 */
export async function subscribeToPush(): Promise<NativeSubscriptionStatus> {
    // Request permission
    const permission = await requestPermission();

    if (permission !== 'granted') {
        return await getSubscriptionStatus();
    }

    // Get push token
    const token = await getExpoPushToken();

    if (!token) {
        return await getSubscriptionStatus();
    }

    // Register with server
    await registerWithServer(token);

    return await getSubscriptionStatus();
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(): Promise<boolean> {
    return await unregisterFromServer();
}

// ============================================================================
// Badge Management
// ============================================================================

/**
 * Set app badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
}

/**
 * Get current badge count
 */
export async function getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
}

/**
 * Clear app badge
 */
export async function clearBadge(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
}

// ============================================================================
// Local Notifications (for testing)
// ============================================================================

/**
 * Schedule a local notification (for testing/offline scenarios)
 */
export async function scheduleLocalNotification(
    title: string,
    body: string,
    data: Record<string, unknown>,
    trigger?: Notifications.NotificationTriggerInput
): Promise<string> {
    const id = await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            data,
            sound: true,
            badge: 1,
        },
        trigger: trigger ?? null,
    });

    return id;
}

/**
 * Cancel a scheduled notification
 */
export async function cancelNotification(id: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(id);
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Dismiss all displayed notifications
 */
export async function dismissAllNotifications(): Promise<void> {
    await Notifications.dismissAllNotificationsAsync();
}
