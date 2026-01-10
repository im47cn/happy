/**
 * @file Web Push 订阅管理
 * @input Push API, ServiceWorkerRegistration, offlineManager, serverConfig
 * @output Web Push 订阅、取消、状态检查等功能
 * @pos 负责 Web Push 通知订阅的完整生命周期管理
 *
 * 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的 CLAUDE.md。
 */

import { Platform } from "react-native";
import { TokenStorage, AuthCredentials } from "@/auth/tokenStorage";
import { getServerUrl } from "@/sync/serverConfig";
import { backoff } from "@/utils/time";
import {
    saveLocalSubscription,
    getLocalSubscription,
    removeLocalSubscription,
    addPendingSync,
    getNetworkState,
} from "./offlineManager";
import type {
    SubscriptionStatus,
    SubscriptionStatusInfo,
    SubscribeRequest,
    SubscribeResponse,
    UnsubscribeRequest,
    UnsubscribeResponse,
    UpdatePreferencesRequest,
    UpdatePreferencesResponse,
    GetSubscriptionStatusResponse,
    VapidPublicKeyResponse,
    NotificationPreferences,
} from "./types";

// ============================================================================
// 常量
// ============================================================================

const DEVICE_ID_KEY = "happy-pwa-device-id";
const VAPID_KEY_CACHE_KEY = "vapid-public-key";
const LOG_PREFIX = "[PushSubscription]";

// ============================================================================
// 内部状态
// ============================================================================

let cachedVapidKey: string | null = null;
let currentDeviceId: string | null = null;
let statusChangeListeners: Set<(status: SubscriptionStatusInfo) => void> = new Set();

// ============================================================================
// 支持检测
// ============================================================================

/**
 * 检测是否支持 Web Push
 */
export function isPushSupported(): boolean {
    return (
        Platform.OS === "web" &&
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window
    );
}

/**
 * 获取当前通知权限状态
 */
export function getNotificationPermission(): NotificationPermission {
    if (!isPushSupported()) {
        return "denied";
    }
    return Notification.permission;
}

// ============================================================================
// 设备 ID 管理
// ============================================================================

/**
 * 获取或生成设备 ID
 * 设备 ID 用于标识当前浏览器/设备
 */
export function getDeviceId(): string {
    if (currentDeviceId) {
        return currentDeviceId;
    }

    if (Platform.OS !== "web" || typeof window === "undefined") {
        return "unknown";
    }

    // 尝试从 localStorage 获取
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);

    if (!deviceId) {
        // 生成新的 UUID v4
        deviceId = generateUUID();
        localStorage.setItem(DEVICE_ID_KEY, deviceId);
        console.log(LOG_PREFIX, "Generated new device ID:", deviceId);
    }

    currentDeviceId = deviceId;
    return deviceId;
}

/**
 * 生成 UUID v4
 */
function generateUUID(): string {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    // Fallback: 使用 crypto.getRandomValues
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);

    // 设置版本 (4) 和变体位
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// ============================================================================
// VAPID 公钥
// ============================================================================

/**
 * 获取 VAPID 公钥
 */
export async function getVapidPublicKey(): Promise<string | null> {
    if (cachedVapidKey) {
        return cachedVapidKey;
    }

    // 尝试从 localStorage 缓存获取
    if (Platform.OS === "web" && typeof window !== "undefined") {
        const cached = localStorage.getItem(VAPID_KEY_CACHE_KEY);
        if (cached) {
            cachedVapidKey = cached;
            return cached;
        }
    }

    // 从服务器获取
    try {
        const serverUrl = getServerUrl();
        const response = await fetch(`${serverUrl}/v1/web-push/vapid-public-key`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            console.error(LOG_PREFIX, "Failed to get VAPID key:", response.status);
            return null;
        }

        const data: VapidPublicKeyResponse = await response.json();
        cachedVapidKey = data.publicKey;

        // 缓存到 localStorage
        if (Platform.OS === "web" && typeof window !== "undefined") {
            localStorage.setItem(VAPID_KEY_CACHE_KEY, data.publicKey);
        }

        console.log(LOG_PREFIX, "Got VAPID public key");
        return data.publicKey;
    } catch (error) {
        console.error(LOG_PREFIX, "Error getting VAPID key:", error);
        return null;
    }
}

/**
 * 将 Base64 URL 编码的 VAPID 公钥转换为 Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray as Uint8Array<ArrayBuffer>;
}

// ============================================================================
// 订阅状态
// ============================================================================

/**
 * 获取当前订阅状态
 */
export async function getSubscriptionStatus(): Promise<SubscriptionStatusInfo> {
    if (!isPushSupported()) {
        return { status: "not_supported" };
    }

    const permission = Notification.permission;

    if (permission === "denied") {
        return { status: "permission_denied" };
    }

    if (permission === "default") {
        return { status: "permission_default" };
    }

    // 检查当前订阅
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            const deviceId = getDeviceId();
            return {
                status: "subscribed",
                endpoint: subscription.endpoint,
                expiresAt: subscription.expirationTime ?? undefined,
                deviceId,
            };
        }

        return { status: "unsubscribed" };
    } catch (error) {
        console.error(LOG_PREFIX, "Error getting subscription status:", error);
        return { status: "unsubscribed" };
    }
}

/**
 * 监听订阅状态变化
 */
export function onSubscriptionStatusChange(
    listener: (status: SubscriptionStatusInfo) => void
): () => void {
    statusChangeListeners.add(listener);

    // 立即通知当前状态
    getSubscriptionStatus().then(listener);

    return () => {
        statusChangeListeners.delete(listener);
    };
}

/**
 * 通知状态变化
 */
async function notifyStatusChange(): Promise<void> {
    const status = await getSubscriptionStatus();
    statusChangeListeners.forEach((listener) => listener(status));
}

// ============================================================================
// 订阅管理
// ============================================================================

/**
 * 请求通知权限
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
    if (!isPushSupported()) {
        return "denied";
    }

    try {
        const permission = await Notification.requestPermission();
        console.log(LOG_PREFIX, "Notification permission:", permission);
        await notifyStatusChange();
        return permission;
    } catch (error) {
        console.error(LOG_PREFIX, "Error requesting permission:", error);
        return "denied";
    }
}

/**
 * 订阅 Web Push 通知
 */
export async function subscribePush(
    preferences?: NotificationPreferences
): Promise<{ success: boolean; error?: string }> {
    if (!isPushSupported()) {
        return { success: false, error: "Push notifications not supported" };
    }

    // 检查权限
    let permission = Notification.permission;
    if (permission === "default") {
        permission = await requestNotificationPermission();
    }

    if (permission !== "granted") {
        return { success: false, error: "Notification permission denied" };
    }

    // 获取 VAPID 公钥
    const vapidKey = await getVapidPublicKey();
    if (!vapidKey) {
        return { success: false, error: "Failed to get VAPID public key" };
    }

    try {
        // 获取 Service Worker 注册
        const registration = await navigator.serviceWorker.ready;

        // 检查是否已经订阅
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            // 创建新订阅
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidKey),
            });
            console.log(LOG_PREFIX, "Created new push subscription");
        }

        // 获取订阅信息
        const subscriptionJson = subscription.toJSON();
        const deviceId = getDeviceId();

        // 保存到本地
        await saveLocalSubscription({
            deviceId,
            endpoint: subscription.endpoint,
            p256dh: subscriptionJson.keys?.p256dh || "",
            auth: subscriptionJson.keys?.auth || "",
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        // 同步到服务器
        const syncSuccess = await syncSubscriptionToServer(
            subscriptionJson,
            deviceId,
            preferences
        );

        if (!syncSuccess) {
            // 离线或失败时，添加到待同步队列
            if (getNetworkState() === "offline") {
                await addPendingSync("subscribe", {
                    subscription: subscriptionJson,
                    deviceId,
                    preferences,
                });
                console.log(LOG_PREFIX, "Added subscription to pending sync queue");
            }
        }

        await notifyStatusChange();
        return { success: true };
    } catch (error) {
        console.error(LOG_PREFIX, "Error subscribing to push:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * 取消订阅 Web Push 通知
 */
export async function unsubscribePush(): Promise<{ success: boolean; error?: string }> {
    if (!isPushSupported()) {
        return { success: false, error: "Push notifications not supported" };
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            return { success: true }; // 已经没有订阅
        }

        const endpoint = subscription.endpoint;
        const deviceId = getDeviceId();

        // 取消浏览器订阅
        await subscription.unsubscribe();
        console.log(LOG_PREFIX, "Unsubscribed from push notifications");

        // 删除本地记录
        await removeLocalSubscription(deviceId);

        // 同步到服务器
        const syncSuccess = await syncUnsubscribeToServer(deviceId, endpoint);

        if (!syncSuccess) {
            // 离线时添加到待同步队列
            if (getNetworkState() === "offline") {
                await addPendingSync("unsubscribe", { deviceId, endpoint });
                console.log(LOG_PREFIX, "Added unsubscribe to pending sync queue");
            }
        }

        await notifyStatusChange();
        return { success: true };
    } catch (error) {
        console.error(LOG_PREFIX, "Error unsubscribing from push:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * 更新通知偏好设置
 */
export async function updateNotificationPreferences(
    preferences: NotificationPreferences
): Promise<{ success: boolean; error?: string }> {
    const deviceId = getDeviceId();

    // 加密偏好设置（简单 Base64 编码，实际应使用端到端加密）
    const encryptedPreferences = btoa(JSON.stringify(preferences));

    // 同步到服务器
    const syncSuccess = await syncPreferencesToServer(deviceId, encryptedPreferences);

    if (!syncSuccess) {
        // 离线时添加到待同步队列
        if (getNetworkState() === "offline") {
            await addPendingSync("update_preferences", {
                deviceId,
                encryptedPreferences,
            });
            console.log(LOG_PREFIX, "Added preferences update to pending sync queue");
            return { success: true }; // 离线时视为成功（会后续同步）
        }
        return { success: false, error: "Failed to sync preferences" };
    }

    return { success: true };
}

// ============================================================================
// 服务器同步
// ============================================================================

/**
 * 同步订阅到服务器
 */
async function syncSubscriptionToServer(
    subscription: PushSubscriptionJSON,
    deviceId: string,
    preferences?: NotificationPreferences
): Promise<boolean> {
    const credentials = await TokenStorage.getCredentials();
    if (!credentials) {
        console.warn(LOG_PREFIX, "No credentials for server sync");
        return false;
    }

    try {
        const serverUrl = getServerUrl();
        const request: SubscribeRequest = {
            subscription,
            deviceId,
            platform: "web",
            encryptedPreferences: preferences
                ? btoa(JSON.stringify(preferences))
                : undefined,
        };

        const response = await backoff(async () => {
            const res = await fetch(`${serverUrl}/v1/web-push/subscribe`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${credentials.token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(request),
            });

            if (!res.ok) {
                throw new Error(`Server responded with ${res.status}`);
            }

            return res.json() as Promise<SubscribeResponse>;
        });

        console.log(LOG_PREFIX, "Subscription synced to server:", response.subscriptionId);
        return true;
    } catch (error) {
        console.error(LOG_PREFIX, "Failed to sync subscription to server:", error);
        return false;
    }
}

/**
 * 同步取消订阅到服务器
 */
async function syncUnsubscribeToServer(deviceId: string, endpoint?: string): Promise<boolean> {
    const credentials = await TokenStorage.getCredentials();
    if (!credentials) {
        console.warn(LOG_PREFIX, "No credentials for server sync");
        return false;
    }

    try {
        const serverUrl = getServerUrl();
        const request: UnsubscribeRequest = { deviceId, endpoint };

        await backoff(async () => {
            const res = await fetch(`${serverUrl}/v1/web-push/unsubscribe`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${credentials.token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(request),
            });

            if (!res.ok) {
                throw new Error(`Server responded with ${res.status}`);
            }

            return res.json() as Promise<UnsubscribeResponse>;
        });

        console.log(LOG_PREFIX, "Unsubscribe synced to server");
        return true;
    } catch (error) {
        console.error(LOG_PREFIX, "Failed to sync unsubscribe to server:", error);
        return false;
    }
}

/**
 * 同步偏好设置到服务器
 */
async function syncPreferencesToServer(
    deviceId: string,
    encryptedPreferences: string
): Promise<boolean> {
    const credentials = await TokenStorage.getCredentials();
    if (!credentials) {
        console.warn(LOG_PREFIX, "No credentials for server sync");
        return false;
    }

    try {
        const serverUrl = getServerUrl();
        const request: UpdatePreferencesRequest = { deviceId, encryptedPreferences };

        await backoff(async () => {
            const res = await fetch(`${serverUrl}/v1/web-push/preferences`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${credentials.token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(request),
            });

            if (!res.ok) {
                throw new Error(`Server responded with ${res.status}`);
            }

            return res.json() as Promise<UpdatePreferencesResponse>;
        });

        console.log(LOG_PREFIX, "Preferences synced to server");
        return true;
    } catch (error) {
        console.error(LOG_PREFIX, "Failed to sync preferences to server:", error);
        return false;
    }
}

/**
 * 获取服务器上的订阅列表
 */
export async function getServerSubscriptions(): Promise<GetSubscriptionStatusResponse["subscriptions"]> {
    const credentials = await TokenStorage.getCredentials();
    if (!credentials) {
        return [];
    }

    try {
        const serverUrl = getServerUrl();
        const response = await fetch(`${serverUrl}/v1/web-push/subscriptions`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${credentials.token}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
        }

        const data: GetSubscriptionStatusResponse = await response.json();
        return data.subscriptions;
    } catch (error) {
        console.error(LOG_PREFIX, "Failed to get server subscriptions:", error);
        return [];
    }
}

// ============================================================================
// 离线同步处理器
// ============================================================================

/**
 * 处理离线同步项
 * 供 offlineManager.registerSyncHandler 使用
 */
export async function handlePushSyncItem(item: {
    type: string;
    data: unknown;
}): Promise<boolean> {
    const { type, data } = item;

    switch (type) {
        case "subscribe": {
            const { subscription, deviceId, preferences } = data as {
                subscription: PushSubscriptionJSON;
                deviceId: string;
                preferences?: NotificationPreferences;
            };
            return syncSubscriptionToServer(subscription, deviceId, preferences);
        }

        case "unsubscribe": {
            const { deviceId, endpoint } = data as { deviceId: string; endpoint?: string };
            return syncUnsubscribeToServer(deviceId, endpoint);
        }

        case "update_preferences": {
            const { deviceId, encryptedPreferences } = data as {
                deviceId: string;
                encryptedPreferences: string;
            };
            return syncPreferencesToServer(deviceId, encryptedPreferences);
        }

        default:
            console.warn(LOG_PREFIX, "Unknown sync item type:", type);
            return false;
    }
}

// ============================================================================
// 初始化
// ============================================================================

/**
 * 初始化 Push 订阅管理
 * 检查现有订阅状态并设置监听
 */
export async function initPushSubscription(): Promise<SubscriptionStatusInfo> {
    if (!isPushSupported()) {
        return { status: "not_supported" };
    }

    // 获取设备 ID（确保已生成）
    getDeviceId();

    // 预加载 VAPID 公钥
    getVapidPublicKey();

    // 获取当前状态
    const status = await getSubscriptionStatus();
    console.log(LOG_PREFIX, "Initialized with status:", status.status);

    return status;
}
