/**
 * @file PWA 模块导出
 * @input types.ts, serviceWorker.ts, install.ts, offlineManager.ts, pushSubscription.ts, notificationRouter.ts, useNotificationSync.ts, usePwaMode.ts
 * @output 模块公开 API（Service Worker、安装、离线、推送、通知路由、状态同步、运行模式检测）
 * @pos 模块入口，统一导出接口和类型
 *
 * 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的 CLAUDE.md。
 */

// 类型导出
export * from "./types";

// Service Worker
export {
    isServiceWorkerSupported,
    registerServiceWorker,
    unregisterServiceWorker,
    getServiceWorkerState,
    checkForUpdates,
    applyUpdate,
    sendMessage,
    onStateChange,
    cacheUrls,
    clearCache,
    // Badge 管理
    setBadge,
    clearBadge,
    incrementBadge,
    decrementBadge,
    getBadgeCount,
    onBadgeChange,
    closeAllNotifications,
    closeNotification,
    closeNotifications,
    // 事件订阅
    onNotificationClick,
    onSubscriptionChange,
} from "./serviceWorker";

// PWA 安装
export {
    isPwaInstallSupported,
    getInstallState,
    getInstallPromptInfo,
    initInstallPrompt,
    promptInstall,
    dismissInstallPrompt,
    resetDismissedState,
    onInstallStateChange,
    shouldShowInstallPrompt,
} from "./install";

// 离线管理
export {
    // 初始化
    isIndexedDBSupported,
    initOfflineDB,
    closeOfflineDB,
    initOfflineManager,
    // 待同步队列
    addPendingSync,
    getPendingSyncItems,
    getPendingSyncCount,
    removePendingSync,
    updatePendingSyncRetry,
    clearPendingSync,
    // 订阅存储
    saveLocalSubscription,
    getLocalSubscription,
    removeLocalSubscription,
    // 缓存数据
    cacheData,
    getCachedData,
    removeCachedData,
    cleanExpiredCache,
    // 网络状态
    getNetworkState,
    initNetworkStateMonitor,
    onNetworkStateChange,
    // 离线信息
    getOfflineInfo,
    onOfflineInfoChange,
    // 同步
    registerSyncHandler,
    triggerSync,
} from "./offlineManager";

// 离线管理类型导出
export type {
    PendingSyncItem,
    LocalSubscription,
    CachedDataItem,
} from "./offlineManager";

// Web Push 订阅管理
export {
    // 支持检测
    isPushSupported,
    getNotificationPermission,
    // 设备 ID
    getDeviceId,
    // VAPID 公钥
    getVapidPublicKey,
    // 订阅状态
    getSubscriptionStatus,
    onSubscriptionStatusChange,
    // 订阅管理
    requestNotificationPermission,
    subscribePush,
    unsubscribePush,
    updateNotificationPreferences,
    // 服务器同步
    getServerSubscriptions,
    handlePushSyncItem,
    // 初始化
    initPushSubscription,
} from "./pushSubscription";

// 通知路由
export {
    // 路由配置
    getRouteFromNotification,
    // 路由集成
    setRouterCallback,
    navigateToRoute,
    // 通知点击处理
    handleNotificationClick,
    // URL 工具
    isInternalRoute,
    parseUrlToRoute,
} from "./notificationRouter";

// 通知路由类型导出
export type { RouteConfig, RouterCallback } from "./notificationRouter";

// 通知状态同步
export {
    useNotificationSync,
    getPendingRequestCount,
    syncBadgeWithPendingRequests,
} from "./useNotificationSync";

// PWA 运行模式检测
export {
    usePwaMode,
    usePwaStandalone,
    useIsMobileWeb,
    isStandaloneMode,
    isMobileWeb,
    getPwaModeInfo,
} from "./usePwaMode";

// PWA 运行模式类型导出
export type {
    PwaDisplayMode,
    PwaModeInfo,
    SafeAreaInsets,
} from "./usePwaMode";
