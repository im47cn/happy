/**
 * @file Service Worker 注册和管理
 * @input navigator.serviceWorker API
 * @output Service Worker 注册状态和控制方法
 * @pos 客户端 Service Worker 生命周期管理
 *
 * 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的 CLAUDE.md。
 */

import { Platform } from "react-native";
import type { ServiceWorkerState, ServiceWorkerMessage, ServiceWorkerCallback, NotificationData } from "./types";

// ============================================================================
// Constants
// ============================================================================

const SERVICE_WORKER_URL = "/service-worker.js";
const REGISTRATION_TIMEOUT = 10000; // 10 seconds

// ============================================================================
// State
// ============================================================================

let registration: ServiceWorkerRegistration | null = null;
let stateChangeCallbacks: ((state: ServiceWorkerState) => void)[] = [];
let badgeChangeCallbacks: ((count: number) => void)[] = [];
let notificationClickCallbacks: ((url: string, data: NotificationData | undefined, action: string | undefined) => void)[] = [];
let subscriptionChangeCallbacks: ((oldEndpoint: string | undefined, newSubscription: PushSubscriptionJSON | undefined, error?: string) => void)[] = [];
let currentBadgeCount = 0;

// ============================================================================
// Public API
// ============================================================================

/**
 * Check if Service Worker is supported in current environment
 */
export function isServiceWorkerSupported(): boolean {
    return (
        Platform.OS === "web" &&
        typeof window !== "undefined" &&
        "serviceWorker" in navigator
    );
}

/**
 * Register Service Worker
 * Should be called after app initial render to avoid blocking
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!isServiceWorkerSupported()) {
        console.log("[PWA] Service Worker not supported");
        return null;
    }

    try {
        // Wait for window load to avoid blocking initial render
        if (document.readyState !== "complete") {
            await new Promise<void>((resolve) => {
                window.addEventListener("load", () => resolve(), { once: true });
            });
        }

        console.log("[PWA] Registering Service Worker...");

        registration = await Promise.race([
            navigator.serviceWorker.register(SERVICE_WORKER_URL, {
                scope: "/",
                updateViaCache: "none",
            }),
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error("Registration timeout")), REGISTRATION_TIMEOUT)
            ),
        ]);

        console.log("[PWA] Service Worker registered:", registration.scope);

        // Set up update handling
        setupUpdateHandling(registration);

        // Set up message handling
        setupMessageHandling();

        return registration;
    } catch (error) {
        console.error("[PWA] Service Worker registration failed:", error);
        return null;
    }
}

/**
 * Unregister Service Worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
    if (!isServiceWorkerSupported()) {
        return false;
    }

    try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((reg) => reg.unregister()));
        registration = null;
        console.log("[PWA] Service Worker unregistered");
        return true;
    } catch (error) {
        console.error("[PWA] Service Worker unregistration failed:", error);
        return false;
    }
}

/**
 * Get current Service Worker state
 */
export function getServiceWorkerState(): ServiceWorkerState {
    if (!isServiceWorkerSupported()) {
        return {
            supported: false,
            registered: false,
            installing: false,
            waiting: false,
            active: false,
            updateAvailable: false,
        };
    }

    return {
        supported: true,
        registered: registration !== null,
        installing: registration?.installing !== null,
        waiting: registration?.waiting !== null,
        active: registration?.active !== null,
        updateAvailable: registration?.waiting !== null,
        controller: navigator.serviceWorker.controller !== null,
    };
}

/**
 * Check for Service Worker updates
 */
export async function checkForUpdates(): Promise<boolean> {
    if (!registration) {
        return false;
    }

    try {
        await registration.update();
        return registration.waiting !== null;
    } catch (error) {
        console.error("[PWA] Update check failed:", error);
        return false;
    }
}

/**
 * Apply waiting Service Worker update
 * This will refresh the page when the new worker takes control
 */
export async function applyUpdate(): Promise<void> {
    if (!registration?.waiting) {
        return;
    }

    // Tell the waiting worker to skip waiting
    registration.waiting.postMessage({ type: "SKIP_WAITING" });
}

/**
 * Send message to Service Worker
 */
export function sendMessage(message: ServiceWorkerMessage): void {
    if (!registration?.active) {
        console.warn("[PWA] No active Service Worker to send message");
        return;
    }

    registration.active.postMessage(message);
}

/**
 * Subscribe to Service Worker state changes
 */
export function onStateChange(callback: (state: ServiceWorkerState) => void): () => void {
    stateChangeCallbacks.push(callback);
    return () => {
        stateChangeCallbacks = stateChangeCallbacks.filter((cb) => cb !== callback);
    };
}

/**
 * Request cache of specific URLs
 */
export function cacheUrls(urls: string[]): void {
    sendMessage({
        type: "CACHE_URLS",
        payload: { urls },
    });
}

/**
 * Clear all Service Worker caches
 */
export function clearCache(): void {
    sendMessage({ type: "CLEAR_CACHE" });
}

// ============================================================================
// Badge Management
// ============================================================================

/**
 * Set app badge count
 */
export function setBadge(count: number): void {
    sendMessage({ type: "SET_BADGE", payload: { count } });
    currentBadgeCount = count;
    notifyBadgeChange();
}

/**
 * Clear app badge
 */
export function clearBadge(): void {
    sendMessage({ type: "CLEAR_BADGE" });
    currentBadgeCount = 0;
    notifyBadgeChange();
}

/**
 * Increment app badge count
 */
export function incrementBadge(): void {
    sendMessage({ type: "INCREMENT_BADGE" });
    currentBadgeCount++;
    notifyBadgeChange();
}

/**
 * Decrement app badge count
 */
export function decrementBadge(): void {
    sendMessage({ type: "DECREMENT_BADGE" });
    currentBadgeCount = Math.max(0, currentBadgeCount - 1);
    notifyBadgeChange();
}

/**
 * Get current badge count
 */
export function getBadgeCount(): number {
    return currentBadgeCount;
}

/**
 * Subscribe to badge count changes
 */
export function onBadgeChange(callback: (count: number) => void): () => void {
    badgeChangeCallbacks.push(callback);
    return () => {
        badgeChangeCallbacks = badgeChangeCallbacks.filter((cb) => cb !== callback);
    };
}

/**
 * Close all notifications
 */
export function closeAllNotifications(): void {
    sendMessage({ type: "CLOSE_ALL_NOTIFICATIONS" });
    currentBadgeCount = 0;
    notifyBadgeChange();
}

/**
 * Close a specific notification by tag or requestId
 * @param options - Either { tag: string } or { requestId: string }
 */
export function closeNotification(options: { tag?: string; requestId?: string }): void {
    if (!options.tag && !options.requestId) {
        console.warn("[PWA] closeNotification requires either tag or requestId");
        return;
    }
    sendMessage({
        type: "CLOSE_NOTIFICATION",
        payload: options,
    });
    currentBadgeCount = Math.max(0, currentBadgeCount - 1);
    notifyBadgeChange();
}

/**
 * Close multiple notifications by tags or requestIds
 * @param options - { tags?: string[], requestIds?: string[] }
 */
export function closeNotifications(options: { tags?: string[]; requestIds?: string[] }): void {
    const count = (options.tags?.length || 0) + (options.requestIds?.length || 0);
    if (count === 0) {
        console.warn("[PWA] closeNotifications requires tags or requestIds");
        return;
    }
    sendMessage({
        type: "CLOSE_NOTIFICATIONS",
        payload: options,
    });
    currentBadgeCount = Math.max(0, currentBadgeCount - count);
    notifyBadgeChange();
}

// ============================================================================
// Event Subscriptions
// ============================================================================

/**
 * Subscribe to notification click events
 */
export function onNotificationClick(
    callback: (url: string, data: NotificationData | undefined, action: string | undefined) => void
): () => void {
    notificationClickCallbacks.push(callback);
    return () => {
        notificationClickCallbacks = notificationClickCallbacks.filter((cb) => cb !== callback);
    };
}

/**
 * Subscribe to push subscription change events
 */
export function onSubscriptionChange(
    callback: (oldEndpoint: string | undefined, newSubscription: PushSubscriptionJSON | undefined, error?: string) => void
): () => void {
    subscriptionChangeCallbacks.push(callback);
    return () => {
        subscriptionChangeCallbacks = subscriptionChangeCallbacks.filter((cb) => cb !== callback);
    };
}

// ============================================================================
// Internal Helpers
// ============================================================================

/**
 * Notify all state change subscribers
 */
function notifyStateChange(): void {
    const state = getServiceWorkerState();
    stateChangeCallbacks.forEach((callback) => callback(state));
}

/**
 * Notify all badge change subscribers
 */
function notifyBadgeChange(): void {
    badgeChangeCallbacks.forEach((callback) => callback(currentBadgeCount));
}

/**
 * Notify all notification click subscribers
 */
function notifyNotificationClick(url: string, data: NotificationData | undefined, action: string | undefined): void {
    notificationClickCallbacks.forEach((callback) => callback(url, data, action));
}

/**
 * Notify all subscription change subscribers
 */
function notifySubscriptionChange(oldEndpoint: string | undefined, newSubscription: PushSubscriptionJSON | undefined, error?: string): void {
    subscriptionChangeCallbacks.forEach((callback) => callback(oldEndpoint, newSubscription, error));
}

/**
 * Set up Service Worker update handling
 */
function setupUpdateHandling(reg: ServiceWorkerRegistration): void {
    // Handle state changes
    reg.addEventListener("updatefound", () => {
        console.log("[PWA] Service Worker update found");
        const installingWorker = reg.installing;

        if (installingWorker) {
            installingWorker.addEventListener("statechange", () => {
                console.log("[PWA] Installing worker state:", installingWorker.state);
                notifyStateChange();

                if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
                    // New worker is waiting, update available
                    console.log("[PWA] New Service Worker waiting");
                }
            });
        }
    });

    // Check for updates periodically (every hour)
    setInterval(() => {
        reg.update().catch((error) => {
            console.warn("[PWA] Periodic update check failed:", error);
        });
    }, 60 * 60 * 1000);
}

/**
 * Set up message handling from Service Worker
 */
function setupMessageHandling(): void {
    navigator.serviceWorker.addEventListener("message", (event) => {
        const message = event.data as ServiceWorkerCallback;
        if (!message || !message.type) {
            console.log("[PWA] Unknown message from Service Worker:", event.data);
            return;
        }

        switch (message.type) {
            case "NOTIFICATION_CLICK":
                handleNotificationClick(message.url || "/", message.data, message.action);
                notifyNotificationClick(message.url || "/", message.data, message.action);
                break;

            case "NOTIFICATION_DISMISSED":
                console.log("[PWA] Notification dismissed:", message.data);
                break;

            case "BADGE_UPDATE":
                if (typeof message.count === "number") {
                    currentBadgeCount = message.count;
                    notifyBadgeChange();
                }
                break;

            case "BADGE_COUNT":
                if (typeof message.count === "number") {
                    currentBadgeCount = message.count;
                    notifyBadgeChange();
                }
                break;

            case "PUSH_SUBSCRIPTION_CHANGED":
                console.log("[PWA] Push subscription changed:", message.oldEndpoint, message.newSubscription);
                notifySubscriptionChange(message.oldEndpoint, message.newSubscription);
                break;

            case "PUSH_SUBSCRIPTION_EXPIRED":
                console.log("[PWA] Push subscription expired:", message.oldEndpoint, message.error);
                notifySubscriptionChange(message.oldEndpoint, undefined, message.error);
                break;

            case "SILENT_PUSH":
                console.log("[PWA] Silent push received:", message.payload);
                // Can trigger sync or other background operations
                break;

            case "BACKGROUND_SYNC":
                console.log("[PWA] Background sync triggered:", message.tag);
                // Can trigger pending data sync
                break;

            default:
                console.log("[PWA] Message from Service Worker:", event.data);
        }
    });

    // Handle controller change (new Service Worker activated)
    navigator.serviceWorker.addEventListener("controllerchange", () => {
        console.log("[PWA] Controller changed, reloading...");
        window.location.reload();
    });
}

/**
 * Handle notification click from Service Worker
 */
function handleNotificationClick(url: string, data: unknown, action?: string): void {
    console.log("[PWA] Notification click:", { url, data, action });

    // Navigate to the target URL
    if (url && typeof window !== "undefined") {
        // Use React Router navigation if available, otherwise use window.location
        if (window.history && typeof window.history.pushState === "function") {
            window.history.pushState(null, "", url);
            // Dispatch popstate event to trigger router update
            window.dispatchEvent(new PopStateEvent("popstate"));
        } else {
            window.location.href = url;
        }
    }
}
