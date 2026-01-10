/**
 * @file 离线状态管理和 IndexedDB 存储
 * @input navigator.onLine, IndexedDB API
 * @output 离线状态检测、待同步队列管理、本地缓存
 * @pos 负责 PWA 离线功能的核心逻辑
 *
 * 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的 CLAUDE.md。
 */

import { Platform } from "react-native";
import type { NetworkState, OfflineInfo } from "./types";

// ============================================================================
// 常量
// ============================================================================

const DB_NAME = "happy-offline-db";
const DB_VERSION = 1;

/** 存储类型 */
const STORE_NAMES = {
    PENDING_SYNC: "pending-sync",
    SUBSCRIPTIONS: "subscriptions",
    CACHED_DATA: "cached-data",
} as const;

/** 慢网络检测阈值（毫秒） */
const SLOW_NETWORK_THRESHOLD_MS = 3000;

// ============================================================================
// 内部状态
// ============================================================================

let db: IDBDatabase | null = null;
let currentNetworkState: NetworkState = "online";
const networkStateListeners: Set<(state: NetworkState) => void> = new Set();
const offlineInfoListeners: Set<(info: OfflineInfo) => void> = new Set();

// ============================================================================
// IndexedDB 初始化
// ============================================================================

/**
 * 检测是否支持 IndexedDB
 */
export function isIndexedDBSupported(): boolean {
    return (
        Platform.OS === "web" &&
        typeof window !== "undefined" &&
        "indexedDB" in window
    );
}

/**
 * 初始化 IndexedDB 数据库
 */
export async function initOfflineDB(): Promise<boolean> {
    if (!isIndexedDBSupported()) {
        console.log("[OfflineManager] IndexedDB not supported");
        return false;
    }

    if (db) {
        return true;
    }

    return new Promise((resolve) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error("[OfflineManager] Failed to open database:", request.error);
            resolve(false);
        };

        request.onsuccess = () => {
            db = request.result;
            console.log("[OfflineManager] Database opened successfully");
            resolve(true);
        };

        request.onupgradeneeded = (event) => {
            const database = (event.target as IDBOpenDBRequest).result;

            // 待同步队列存储
            if (!database.objectStoreNames.contains(STORE_NAMES.PENDING_SYNC)) {
                const syncStore = database.createObjectStore(STORE_NAMES.PENDING_SYNC, {
                    keyPath: "id",
                    autoIncrement: true,
                });
                syncStore.createIndex("type", "type", { unique: false });
                syncStore.createIndex("createdAt", "createdAt", { unique: false });
            }

            // 订阅信息存储
            if (!database.objectStoreNames.contains(STORE_NAMES.SUBSCRIPTIONS)) {
                const subStore = database.createObjectStore(STORE_NAMES.SUBSCRIPTIONS, {
                    keyPath: "deviceId",
                });
                subStore.createIndex("endpoint", "endpoint", { unique: true });
            }

            // 缓存数据存储
            if (!database.objectStoreNames.contains(STORE_NAMES.CACHED_DATA)) {
                const cacheStore = database.createObjectStore(STORE_NAMES.CACHED_DATA, {
                    keyPath: "key",
                });
                cacheStore.createIndex("expiresAt", "expiresAt", { unique: false });
            }

            console.log("[OfflineManager] Database schema created");
        };
    });
}

/**
 * 关闭数据库连接
 */
export function closeOfflineDB(): void {
    if (db) {
        db.close();
        db = null;
    }
}

// ============================================================================
// 待同步队列管理
// ============================================================================

/**
 * 待同步项类型
 */
export interface PendingSyncItem {
    id?: number;
    type: "subscribe" | "unsubscribe" | "update_preferences" | "custom";
    data: unknown;
    createdAt: number;
    retryCount: number;
    maxRetries: number;
}

/**
 * 添加待同步项
 */
export async function addPendingSync(
    type: PendingSyncItem["type"],
    data: unknown,
    maxRetries: number = 3
): Promise<number | null> {
    if (!db) {
        console.warn("[OfflineManager] Database not initialized");
        return null;
    }

    return new Promise((resolve) => {
        const transaction = db!.transaction([STORE_NAMES.PENDING_SYNC], "readwrite");
        const store = transaction.objectStore(STORE_NAMES.PENDING_SYNC);

        const item: PendingSyncItem = {
            type,
            data,
            createdAt: Date.now(),
            retryCount: 0,
            maxRetries,
        };

        const request = store.add(item);

        request.onsuccess = () => {
            const id = request.result as number;
            console.log("[OfflineManager] Added pending sync item:", id);
            notifyOfflineInfoChange();
            resolve(id);
        };

        request.onerror = () => {
            console.error("[OfflineManager] Failed to add pending sync:", request.error);
            resolve(null);
        };
    });
}

/**
 * 获取所有待同步项
 */
export async function getPendingSyncItems(): Promise<PendingSyncItem[]> {
    if (!db) {
        return [];
    }

    return new Promise((resolve) => {
        const transaction = db!.transaction([STORE_NAMES.PENDING_SYNC], "readonly");
        const store = transaction.objectStore(STORE_NAMES.PENDING_SYNC);
        const request = store.getAll();

        request.onsuccess = () => {
            resolve(request.result || []);
        };

        request.onerror = () => {
            console.error("[OfflineManager] Failed to get pending sync items:", request.error);
            resolve([]);
        };
    });
}

/**
 * 获取待同步项数量
 */
export async function getPendingSyncCount(): Promise<number> {
    if (!db) {
        return 0;
    }

    return new Promise((resolve) => {
        const transaction = db!.transaction([STORE_NAMES.PENDING_SYNC], "readonly");
        const store = transaction.objectStore(STORE_NAMES.PENDING_SYNC);
        const request = store.count();

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            resolve(0);
        };
    });
}

/**
 * 删除待同步项
 */
export async function removePendingSync(id: number): Promise<boolean> {
    if (!db) {
        return false;
    }

    return new Promise((resolve) => {
        const transaction = db!.transaction([STORE_NAMES.PENDING_SYNC], "readwrite");
        const store = transaction.objectStore(STORE_NAMES.PENDING_SYNC);
        const request = store.delete(id);

        request.onsuccess = () => {
            console.log("[OfflineManager] Removed pending sync item:", id);
            notifyOfflineInfoChange();
            resolve(true);
        };

        request.onerror = () => {
            console.error("[OfflineManager] Failed to remove pending sync:", request.error);
            resolve(false);
        };
    });
}

/**
 * 更新待同步项（增加重试次数）
 */
export async function updatePendingSyncRetry(id: number): Promise<boolean> {
    if (!db) {
        return false;
    }

    return new Promise((resolve) => {
        const transaction = db!.transaction([STORE_NAMES.PENDING_SYNC], "readwrite");
        const store = transaction.objectStore(STORE_NAMES.PENDING_SYNC);
        const getRequest = store.get(id);

        getRequest.onsuccess = () => {
            const item = getRequest.result as PendingSyncItem | undefined;
            if (!item) {
                resolve(false);
                return;
            }

            item.retryCount += 1;

            if (item.retryCount >= item.maxRetries) {
                // 超过最大重试次数，删除项
                store.delete(id);
                console.log("[OfflineManager] Max retries reached, removing item:", id);
                notifyOfflineInfoChange();
                resolve(true);
            } else {
                const updateRequest = store.put(item);
                updateRequest.onsuccess = () => {
                    resolve(true);
                };
                updateRequest.onerror = () => {
                    resolve(false);
                };
            }
        };

        getRequest.onerror = () => {
            resolve(false);
        };
    });
}

/**
 * 清空所有待同步项
 */
export async function clearPendingSync(): Promise<boolean> {
    if (!db) {
        return false;
    }

    return new Promise((resolve) => {
        const transaction = db!.transaction([STORE_NAMES.PENDING_SYNC], "readwrite");
        const store = transaction.objectStore(STORE_NAMES.PENDING_SYNC);
        const request = store.clear();

        request.onsuccess = () => {
            console.log("[OfflineManager] Cleared all pending sync items");
            notifyOfflineInfoChange();
            resolve(true);
        };

        request.onerror = () => {
            resolve(false);
        };
    });
}

// ============================================================================
// 订阅信息存储
// ============================================================================

/**
 * 本地存储的订阅信息
 */
export interface LocalSubscription {
    deviceId: string;
    endpoint: string;
    p256dh: string;
    auth: string;
    createdAt: number;
    updatedAt: number;
}

/**
 * 保存订阅信息到本地
 */
export async function saveLocalSubscription(subscription: LocalSubscription): Promise<boolean> {
    if (!db) {
        return false;
    }

    return new Promise((resolve) => {
        const transaction = db!.transaction([STORE_NAMES.SUBSCRIPTIONS], "readwrite");
        const store = transaction.objectStore(STORE_NAMES.SUBSCRIPTIONS);
        const request = store.put(subscription);

        request.onsuccess = () => {
            console.log("[OfflineManager] Saved local subscription");
            resolve(true);
        };

        request.onerror = () => {
            console.error("[OfflineManager] Failed to save subscription:", request.error);
            resolve(false);
        };
    });
}

/**
 * 获取本地订阅信息
 */
export async function getLocalSubscription(deviceId: string): Promise<LocalSubscription | null> {
    if (!db) {
        return null;
    }

    return new Promise((resolve) => {
        const transaction = db!.transaction([STORE_NAMES.SUBSCRIPTIONS], "readonly");
        const store = transaction.objectStore(STORE_NAMES.SUBSCRIPTIONS);
        const request = store.get(deviceId);

        request.onsuccess = () => {
            resolve(request.result || null);
        };

        request.onerror = () => {
            resolve(null);
        };
    });
}

/**
 * 删除本地订阅信息
 */
export async function removeLocalSubscription(deviceId: string): Promise<boolean> {
    if (!db) {
        return false;
    }

    return new Promise((resolve) => {
        const transaction = db!.transaction([STORE_NAMES.SUBSCRIPTIONS], "readwrite");
        const store = transaction.objectStore(STORE_NAMES.SUBSCRIPTIONS);
        const request = store.delete(deviceId);

        request.onsuccess = () => {
            console.log("[OfflineManager] Removed local subscription");
            resolve(true);
        };

        request.onerror = () => {
            resolve(false);
        };
    });
}

// ============================================================================
// 缓存数据存储
// ============================================================================

/**
 * 缓存数据项
 */
export interface CachedDataItem {
    key: string;
    data: unknown;
    createdAt: number;
    expiresAt: number;
}

/**
 * 缓存数据
 */
export async function cacheData(
    key: string,
    data: unknown,
    ttlMs: number = 3600000 // 默认 1 小时
): Promise<boolean> {
    if (!db) {
        return false;
    }

    return new Promise((resolve) => {
        const transaction = db!.transaction([STORE_NAMES.CACHED_DATA], "readwrite");
        const store = transaction.objectStore(STORE_NAMES.CACHED_DATA);

        const item: CachedDataItem = {
            key,
            data,
            createdAt: Date.now(),
            expiresAt: Date.now() + ttlMs,
        };

        const request = store.put(item);

        request.onsuccess = () => {
            resolve(true);
        };

        request.onerror = () => {
            resolve(false);
        };
    });
}

/**
 * 获取缓存数据
 */
export async function getCachedData<T = unknown>(key: string): Promise<T | null> {
    if (!db) {
        return null;
    }

    return new Promise((resolve) => {
        const transaction = db!.transaction([STORE_NAMES.CACHED_DATA], "readonly");
        const store = transaction.objectStore(STORE_NAMES.CACHED_DATA);
        const request = store.get(key);

        request.onsuccess = () => {
            const item = request.result as CachedDataItem | undefined;
            if (!item) {
                resolve(null);
                return;
            }

            // 检查是否过期
            if (Date.now() > item.expiresAt) {
                // 异步清理过期数据
                removeCachedData(key);
                resolve(null);
                return;
            }

            resolve(item.data as T);
        };

        request.onerror = () => {
            resolve(null);
        };
    });
}

/**
 * 删除缓存数据
 */
export async function removeCachedData(key: string): Promise<boolean> {
    if (!db) {
        return false;
    }

    return new Promise((resolve) => {
        const transaction = db!.transaction([STORE_NAMES.CACHED_DATA], "readwrite");
        const store = transaction.objectStore(STORE_NAMES.CACHED_DATA);
        const request = store.delete(key);

        request.onsuccess = () => {
            resolve(true);
        };

        request.onerror = () => {
            resolve(false);
        };
    });
}

/**
 * 清理所有过期缓存
 */
export async function cleanExpiredCache(): Promise<number> {
    if (!db) {
        return 0;
    }

    return new Promise((resolve) => {
        const transaction = db!.transaction([STORE_NAMES.CACHED_DATA], "readwrite");
        const store = transaction.objectStore(STORE_NAMES.CACHED_DATA);
        const index = store.index("expiresAt");
        const range = IDBKeyRange.upperBound(Date.now());
        const request = index.openCursor(range);

        let deletedCount = 0;

        request.onsuccess = () => {
            const cursor = request.result;
            if (cursor) {
                cursor.delete();
                deletedCount++;
                cursor.continue();
            } else {
                console.log("[OfflineManager] Cleaned expired cache:", deletedCount);
                resolve(deletedCount);
            }
        };

        request.onerror = () => {
            resolve(deletedCount);
        };
    });
}

// ============================================================================
// 网络状态检测
// ============================================================================

/**
 * 获取当前网络状态
 */
export function getNetworkState(): NetworkState {
    return currentNetworkState;
}

/**
 * 初始化网络状态监听
 */
export function initNetworkStateMonitor(): void {
    if (Platform.OS !== "web" || typeof window === "undefined") {
        return;
    }

    // 初始状态
    currentNetworkState = navigator.onLine ? "online" : "offline";

    // 监听 online/offline 事件
    window.addEventListener("online", () => {
        updateNetworkState("online");
    });

    window.addEventListener("offline", () => {
        updateNetworkState("offline");
    });

    // 使用 Connection API 检测慢网络
    if ("connection" in navigator) {
        const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
        if (connection) {
            connection.addEventListener("change", () => {
                detectSlowNetwork();
            });
        }
    }

    console.log("[OfflineManager] Network state monitor initialized:", currentNetworkState);
}

/**
 * 网络信息 API 类型
 */
interface NetworkInformation extends EventTarget {
    effectiveType: "slow-2g" | "2g" | "3g" | "4g";
    downlink: number;
    rtt: number;
    saveData: boolean;
    addEventListener(type: "change", listener: () => void): void;
}

/**
 * 检测慢网络
 */
function detectSlowNetwork(): void {
    if ("connection" in navigator) {
        const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
        if (connection) {
            // 基于 effectiveType 或 rtt 判断慢网络
            if (
                connection.effectiveType === "slow-2g" ||
                connection.effectiveType === "2g" ||
                connection.rtt > SLOW_NETWORK_THRESHOLD_MS
            ) {
                updateNetworkState("slow");
                return;
            }
        }
    }

    // 如果在线但不是慢网络，设置为 online
    if (navigator.onLine && currentNetworkState === "slow") {
        updateNetworkState("online");
    }
}

/**
 * 更新网络状态
 */
function updateNetworkState(state: NetworkState): void {
    if (currentNetworkState === state) {
        return;
    }

    currentNetworkState = state;
    console.log("[OfflineManager] Network state changed:", state);

    // 通知监听器
    networkStateListeners.forEach((listener) => listener(state));
    notifyOfflineInfoChange();

    // 如果恢复在线，触发同步
    if (state === "online") {
        triggerSync();
    }
}

/**
 * 监听网络状态变化
 */
export function onNetworkStateChange(listener: (state: NetworkState) => void): () => void {
    networkStateListeners.add(listener);
    // 立即通知当前状态
    listener(currentNetworkState);
    return () => {
        networkStateListeners.delete(listener);
    };
}

// ============================================================================
// 离线信息
// ============================================================================

/**
 * 获取离线信息
 */
export async function getOfflineInfo(): Promise<OfflineInfo> {
    const pendingSync = await getPendingSyncCount();

    return {
        networkState: currentNetworkState,
        lastOnlineAt: currentNetworkState === "online" ? Date.now() : undefined,
        pendingSync,
    };
}

/**
 * 监听离线信息变化
 */
export function onOfflineInfoChange(listener: (info: OfflineInfo) => void): () => void {
    offlineInfoListeners.add(listener);
    // 异步通知当前状态
    getOfflineInfo().then(listener);
    return () => {
        offlineInfoListeners.delete(listener);
    };
}

/**
 * 通知离线信息变化
 */
async function notifyOfflineInfoChange(): Promise<void> {
    const info = await getOfflineInfo();
    offlineInfoListeners.forEach((listener) => listener(info));
}

// ============================================================================
// 同步触发
// ============================================================================

let syncInProgress = false;
let syncCallbacks: ((success: boolean) => void)[] = [];

/**
 * 注册同步处理函数
 */
export function registerSyncHandler(handler: (item: PendingSyncItem) => Promise<boolean>): void {
    syncHandler = handler;
}

let syncHandler: ((item: PendingSyncItem) => Promise<boolean>) | null = null;

/**
 * 触发同步
 */
export async function triggerSync(): Promise<boolean> {
    if (syncInProgress) {
        return new Promise((resolve) => {
            syncCallbacks.push(resolve);
        });
    }

    if (currentNetworkState === "offline") {
        console.log("[OfflineManager] Cannot sync while offline");
        return false;
    }

    if (!syncHandler) {
        console.warn("[OfflineManager] No sync handler registered");
        return false;
    }

    syncInProgress = true;
    console.log("[OfflineManager] Starting sync...");

    try {
        const items = await getPendingSyncItems();
        let allSuccess = true;

        for (const item of items) {
            // Note: currentNetworkState can change during async operations
            // Use type assertion to bypass TypeScript's control flow narrowing
            if ((currentNetworkState as NetworkState) === "offline") {
                console.log("[OfflineManager] Sync interrupted: went offline");
                allSuccess = false;
                break;
            }

            try {
                const success = await syncHandler(item);
                if (success && item.id) {
                    await removePendingSync(item.id);
                } else if (item.id) {
                    await updatePendingSyncRetry(item.id);
                    allSuccess = false;
                }
            } catch (error) {
                console.error("[OfflineManager] Sync item failed:", error);
                if (item.id) {
                    await updatePendingSyncRetry(item.id);
                }
                allSuccess = false;
            }
        }

        console.log("[OfflineManager] Sync completed:", allSuccess ? "success" : "partial");
        return allSuccess;
    } finally {
        syncInProgress = false;
        const callbacks = syncCallbacks;
        syncCallbacks = [];
        callbacks.forEach((cb) => cb(true));
    }
}

// ============================================================================
// 初始化
// ============================================================================

/**
 * 初始化离线管理器
 */
export async function initOfflineManager(): Promise<boolean> {
    if (Platform.OS !== "web") {
        return false;
    }

    const dbInitialized = await initOfflineDB();
    initNetworkStateMonitor();

    // 定期清理过期缓存
    setInterval(() => {
        cleanExpiredCache();
    }, 60 * 60 * 1000); // 每小时清理一次

    return dbInitialized;
}
