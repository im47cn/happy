/**
 * @file Native Push Notification Module Index
 * @input pushService, types
 * @output Unified exports for native push notifications
 * @pos Module entry point for iOS/Android push notifications
 *
 * 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的 CLAUDE.md。
 */

// Re-export types
export type {
    ExpoPushToken,
    DevicePushToken,
    PushToken,
    NativePermissionStatus,
    NativeSubscriptionStatus,
    IOSNotificationSettings,
    AndroidNotificationChannel,
    ApprovalNotification,
    NotificationAction,
    NotificationCategory,
    NativeSubscribeRequest,
    NativeSubscribeResponse,
} from './types';

// Re-export shared types from PWA (for convenience)
export type {
    Platform,
    NotificationType,
    Urgency,
    NotificationPayload,
    NotificationData,
    NotificationPreferences,
} from './types';

export { DEFAULT_NOTIFICATION_PREFERENCES } from './types';

// Re-export push service functions
export {
    // Initialization
    initializePushService,
    subscribeToPush,
    unsubscribeFromPush,

    // Permission
    getPermissionStatus,
    requestPermission,

    // Token management
    getExpoPushToken,
    getDevicePushToken,

    // Device ID
    getDeviceId,

    // Server registration
    registerWithServer,
    unregisterFromServer,

    // Subscription status
    getSubscriptionStatus,

    // Badge management
    setBadgeCount,
    getBadgeCount,
    clearBadge,

    // Local notifications
    scheduleLocalNotification,
    cancelNotification,
    cancelAllNotifications,
    dismissAllNotifications,

    // Channel/Category setup
    setupAndroidChannels,
    setupNotificationCategories,

    // Constants
    NOTIFICATION_CHANNELS,
    NOTIFICATION_CATEGORIES,
} from './pushService';

// Re-export biometric service types
export type {
    BiometricType,
    BiometricAvailability,
    BiometricAuthResult,
} from './biometricService';

// Re-export biometric service functions
export {
    // Availability
    checkBiometricAvailability,
    getBiometricTypeName,

    // Authentication
    authenticate,
    authenticateForApproval,

    // Credential storage
    saveCredentials as saveBiometricCredentials,
    getCredentials as getBiometricCredentials,
    clearCredentials as clearBiometricCredentials,
    isBiometricLoginEnabled,

    // Quick login
    biometricQuickLogin,

    // Initialization
    initializeBiometricService,
} from './biometricService';
