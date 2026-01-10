/**
 * @file Web Push 订阅状态 Hook
 * @input @/pwa/pushSubscription, @/pwa/types
 * @output React hook 用于管理 Web Push 订阅状态和操作
 * @pos 提供 React 组件所需的推送订阅状态、权限和操作方法
 *
 * 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的 CLAUDE.md。
 */

import { useState, useEffect, useCallback } from "react";
import { Platform } from "react-native";
import type {
    SubscriptionStatus,
    SubscriptionStatusInfo,
    NotificationPreferences,
} from "@/pwa/types";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/pwa/types";
import {
    isPushSupported,
    getNotificationPermission,
    initPushSubscription,
    getSubscriptionStatus,
    onSubscriptionStatusChange,
    requestNotificationPermission,
    subscribePush,
    unsubscribePush,
    updateNotificationPreferences,
    getServerSubscriptions,
    getDeviceId,
} from "@/pwa/pushSubscription";

/**
 * 推送订阅 Hook 返回值
 */
export interface UsePushSubscriptionResult {
    /** 是否正在初始化 */
    isInitializing: boolean;
    /** 是否支持 Web Push */
    isSupported: boolean;
    /** 是否为 Web 平台 */
    isWeb: boolean;
    /** 订阅状态 */
    status: SubscriptionStatus;
    /** 订阅状态详情 */
    statusInfo: SubscriptionStatusInfo | null;
    /** 通知权限状态 */
    permission: NotificationPermission;
    /** 是否已订阅 */
    isSubscribed: boolean;
    /** 设备 ID */
    deviceId: string | null;
    /** 通知偏好设置 */
    preferences: NotificationPreferences;
    /** 是否正在执行操作 */
    isLoading: boolean;
    /** 错误信息 */
    error: string | null;
    /** 请求通知权限 */
    requestPermission: () => Promise<NotificationPermission>;
    /** 订阅推送通知 */
    subscribe: (preferences?: NotificationPreferences) => Promise<boolean>;
    /** 取消订阅推送通知 */
    unsubscribe: () => Promise<boolean>;
    /** 更新通知偏好 */
    updatePreferences: (preferences: NotificationPreferences) => Promise<boolean>;
    /** 刷新状态 */
    refresh: () => Promise<void>;
}

/**
 * Web Push 订阅状态管理 Hook
 *
 * 仅在 Web 平台生效，其他平台返回不支持状态
 *
 * @example
 * ```tsx
 * const {
 *   isSubscribed,
 *   subscribe,
 *   unsubscribe,
 *   preferences,
 *   updatePreferences,
 * } = usePushSubscription();
 *
 * // 订阅推送
 * const handleSubscribe = async () => {
 *   const success = await subscribe();
 *   if (success) {
 *     console.log('Subscribed successfully');
 *   }
 * };
 * ```
 */
export function usePushSubscription(): UsePushSubscriptionResult {
    const isWeb = Platform.OS === "web";
    const [isInitializing, setIsInitializing] = useState(true);
    const [isSupported, setIsSupported] = useState(false);
    const [status, setStatus] = useState<SubscriptionStatus>("not_supported");
    const [statusInfo, setStatusInfo] = useState<SubscriptionStatusInfo | null>(null);
    const [permission, setPermission] = useState<NotificationPermission>("default");
    const [deviceId, setDeviceId] = useState<string | null>(null);
    const [preferences, setPreferences] = useState<NotificationPreferences>(
        DEFAULT_NOTIFICATION_PREFERENCES
    );
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 初始化
    useEffect(() => {
        if (!isWeb) {
            setIsInitializing(false);
            return;
        }

        let mounted = true;

        const init = async () => {
            const supported = isPushSupported();
            if (mounted) {
                setIsSupported(supported);
            }

            if (!supported) {
                if (mounted) {
                    setIsInitializing(false);
                }
                return;
            }

            // 初始化订阅管理
            const initialStatus = await initPushSubscription();

            if (!mounted) return;

            setStatusInfo(initialStatus);
            setStatus(initialStatus.status);
            setPermission(getNotificationPermission());
            setDeviceId(getDeviceId());
            setIsInitializing(false);
        };

        init();

        // 监听状态变化
        const unsubscribe = onSubscriptionStatusChange((info) => {
            if (mounted) {
                setStatusInfo(info);
                setStatus(info.status);
                setPermission(getNotificationPermission());
                if (info.preferences) {
                    setPreferences(info.preferences);
                }
            }
        });

        return () => {
            mounted = false;
            unsubscribe();
        };
    }, [isWeb]);

    // 请求通知权限
    const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
        if (!isWeb) {
            return "denied";
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await requestNotificationPermission();
            setPermission(result);
            return result;
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to request permission";
            setError(message);
            return "denied";
        } finally {
            setIsLoading(false);
        }
    }, [isWeb]);

    // 订阅推送
    const subscribe = useCallback(
        async (newPreferences?: NotificationPreferences): Promise<boolean> => {
            if (!isWeb || !isSupported) {
                return false;
            }

            setIsLoading(true);
            setError(null);

            try {
                const prefs = newPreferences || preferences;
                const result = await subscribePush(prefs);

                if (result.success) {
                    setPreferences(prefs);
                    // 刷新状态
                    const newStatus = await getSubscriptionStatus();
                    setStatusInfo(newStatus);
                    setStatus(newStatus.status);
                    return true;
                } else {
                    setError(result.error || "Subscription failed");
                    return false;
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : "Failed to subscribe";
                setError(message);
                return false;
            } finally {
                setIsLoading(false);
            }
        },
        [isWeb, isSupported, preferences]
    );

    // 取消订阅
    const unsubscribe = useCallback(async (): Promise<boolean> => {
        if (!isWeb) {
            return false;
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await unsubscribePush();

            if (result.success) {
                // 刷新状态
                const newStatus = await getSubscriptionStatus();
                setStatusInfo(newStatus);
                setStatus(newStatus.status);
                return true;
            } else {
                setError(result.error || "Unsubscribe failed");
                return false;
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to unsubscribe";
            setError(message);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [isWeb]);

    // 更新偏好设置
    const updatePrefs = useCallback(
        async (newPreferences: NotificationPreferences): Promise<boolean> => {
            if (!isWeb) {
                return false;
            }

            setIsLoading(true);
            setError(null);

            try {
                const result = await updateNotificationPreferences(newPreferences);

                if (result.success) {
                    setPreferences(newPreferences);
                    return true;
                } else {
                    setError(result.error || "Failed to update preferences");
                    return false;
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : "Failed to update preferences";
                setError(message);
                return false;
            } finally {
                setIsLoading(false);
            }
        },
        [isWeb]
    );

    // 刷新状态
    const refresh = useCallback(async (): Promise<void> => {
        if (!isWeb || !isSupported) {
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const newStatus = await getSubscriptionStatus();
            setStatusInfo(newStatus);
            setStatus(newStatus.status);
            setPermission(getNotificationPermission());
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to refresh status";
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, [isWeb, isSupported]);

    // 计算是否已订阅
    const isSubscribed = status === "subscribed";

    return {
        isInitializing,
        isSupported,
        isWeb,
        status,
        statusInfo,
        permission,
        isSubscribed,
        deviceId,
        preferences,
        isLoading,
        error,
        requestPermission,
        subscribe,
        unsubscribe,
        updatePreferences: updatePrefs,
        refresh,
    };
}
