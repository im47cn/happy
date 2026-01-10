/**
 * @file PWA 模块类型定义
 * @input 无
 * @output 导出所有 PWA 相关的 TypeScript 类型
 * @pos 定义 PWA 和 Web Push 相关的客户端类型
 *
 * 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的 CLAUDE.md。
 */

// ============================================================================
// 平台和通知类型
// ============================================================================

/**
 * 推送平台类型
 */
export type Platform = "web" | "ios" | "android";

/**
 * 通知类型
 */
export type NotificationType =
    | "approval_request"   // 审批请求
    | "task_complete"      // 任务完成
    | "new_message"        // 新消息
    | "system";            // 系统公告

/**
 * 通知紧急程度
 */
export type Urgency = "high" | "normal" | "low";

// ============================================================================
// 通知偏好设置
// ============================================================================

/**
 * 通知偏好设置结构
 * 控制用户接收哪些类型的通知
 */
export interface NotificationPreferences {
    enableApprovalRequests: boolean;    // 审批请求通知
    enableTaskComplete: boolean;         // 任务完成通知
    enableNewMessage: boolean;           // 新消息通知
    enableSystemAnnouncements: boolean;  // 系统公告
    muteAll: boolean;                    // 完全静音
}

/**
 * 默认通知偏好设置
 */
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
    enableApprovalRequests: true,
    enableTaskComplete: true,
    enableNewMessage: true,
    enableSystemAnnouncements: true,
    muteAll: false
};

// ============================================================================
// 订阅状态
// ============================================================================

/**
 * 订阅状态枚举
 */
export type SubscriptionStatus =
    | "not_supported"      // 浏览器不支持
    | "permission_denied"  // 用户拒绝权限
    | "permission_default" // 用户未决定
    | "subscribed"         // 已订阅
    | "unsubscribed";      // 未订阅

/**
 * 订阅状态详情
 */
export interface SubscriptionStatusInfo {
    status: SubscriptionStatus;
    endpoint?: string;        // 当前订阅的 endpoint
    expiresAt?: number;       // 过期时间（Unix timestamp）
    deviceId?: string;        // 设备 ID
    preferences?: NotificationPreferences;
}

// ============================================================================
// API 请求/响应类型（与服务端对应）
// ============================================================================

/**
 * 订阅请求
 */
export interface SubscribeRequest {
    subscription: PushSubscriptionJSON;
    deviceId: string;
    platform: Platform;
    encryptedPreferences?: string;
}

/**
 * 订阅响应
 */
export interface SubscribeResponse {
    success: true;
    subscriptionId: string;
}

/**
 * 取消订阅请求
 */
export interface UnsubscribeRequest {
    deviceId: string;
    endpoint?: string;
}

/**
 * 取消订阅响应
 */
export interface UnsubscribeResponse {
    success: true;
}

/**
 * 更新偏好请求
 */
export interface UpdatePreferencesRequest {
    deviceId: string;
    encryptedPreferences: string;
}

/**
 * 更新偏好响应
 */
export interface UpdatePreferencesResponse {
    success: true;
}

/**
 * 获取订阅状态响应
 */
export interface GetSubscriptionStatusResponse {
    subscriptions: Array<{
        id: string;
        deviceId: string;
        platform: Platform;
        endpoint: string;
        createdAt: number;
        updatedAt: number;
        expiresAt: number | null;
    }>;
}

/**
 * VAPID 公钥响应
 */
export interface VapidPublicKeyResponse {
    publicKey: string;
}

/**
 * 错误响应
 */
export interface PushErrorResponse {
    error: string;
    code?: string;
    details?: unknown;
}

// ============================================================================
// 通知内容类型
// ============================================================================

/**
 * 通知负载结构（解密后）
 */
export interface NotificationPayload {
    type: NotificationType;
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    data: NotificationData;
    timestamp: number;
}

/**
 * 通知关联数据
 */
export interface NotificationData {
    type: NotificationType;
    requestId?: string;    // 审批请求 ID
    sessionId?: string;    // 会话 ID
    messageId?: string;    // 消息 ID
    url?: string;          // 跳转 URL
}

// ============================================================================
// PWA 安装状态
// ============================================================================

/**
 * PWA 安装状态
 */
export type InstallState =
    | "not_supported"      // 不支持 PWA
    | "installed"          // 已安装
    | "installable"        // 可安装
    | "dismissed";         // 用户关闭提示

/**
 * PWA 安装提示信息
 */
export interface InstallPromptInfo {
    state: InstallState;
    promptEvent?: BeforeInstallPromptEvent;  // 安装提示事件
    dismissedAt?: number;                    // 关闭时间戳
}

/**
 * BeforeInstallPromptEvent 扩展（W3C 标准）
 */
export interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: "accepted" | "dismissed";
        platform: string;
    }>;
    prompt(): Promise<void>;
}

// ============================================================================
// Service Worker 状态
// ============================================================================

/**
 * Service Worker 注册状态枚举
 */
export type ServiceWorkerStateEnum =
    | "not_supported"   // 浏览器不支持
    | "installing"      // 正在安装
    | "installed"       // 已安装
    | "activating"      // 正在激活
    | "activated"       // 已激活
    | "error";          // 错误

/**
 * Service Worker 状态详情
 */
export interface ServiceWorkerState {
    supported: boolean;        // 是否支持 Service Worker
    registered: boolean;       // 是否已注册
    installing: boolean;       // 是否正在安装
    waiting: boolean;          // 是否有等待中的新版本
    active: boolean;           // 是否已激活
    updateAvailable: boolean;  // 是否有可用更新
    controller?: boolean;      // 当前页面是否被 SW 控制
}

/**
 * Service Worker 更新信息
 */
export interface ServiceWorkerUpdateInfo {
    state: ServiceWorkerStateEnum;
    updateAvailable: boolean;
    lastUpdated?: number;
    error?: string;
}

/**
 * Service Worker 消息类型（发送给 SW）
 */
export type ServiceWorkerMessageType =
    | "SKIP_WAITING"
    | "CACHE_URLS"
    | "CLEAR_CACHE"
    | "SET_BADGE"
    | "CLEAR_BADGE"
    | "INCREMENT_BADGE"
    | "DECREMENT_BADGE"
    | "GET_BADGE"
    | "CLOSE_ALL_NOTIFICATIONS"
    | "CLOSE_NOTIFICATION"       // 关闭特定通知（按 tag 或 requestId）
    | "CLOSE_NOTIFICATIONS";     // 批量关闭通知（按 tags 或 requestIds）

/**
 * Service Worker 消息结构（发送给 SW）
 */
export interface ServiceWorkerMessage {
    type: ServiceWorkerMessageType;
    payload?: {
        urls?: string[];
        count?: number;
        [key: string]: unknown;
    };
}

/**
 * Service Worker 回调消息类型（从 SW 接收）
 */
export type ServiceWorkerCallbackType =
    | "NOTIFICATION_CLICK"
    | "NOTIFICATION_DISMISSED"
    | "BADGE_UPDATE"
    | "BADGE_COUNT"
    | "PUSH_SUBSCRIPTION_CHANGED"
    | "PUSH_SUBSCRIPTION_EXPIRED"
    | "SILENT_PUSH"
    | "BACKGROUND_SYNC";

/**
 * Service Worker 回调消息结构（从 SW 接收）
 */
export interface ServiceWorkerCallback {
    type: ServiceWorkerCallbackType;
    url?: string;
    data?: NotificationData;
    action?: string;
    count?: number;
    tag?: string;
    payload?: unknown;
    oldEndpoint?: string;
    newSubscription?: PushSubscriptionJSON;
    error?: string;
    timestamp?: number;
}

// ============================================================================
// 离线状态
// ============================================================================

/**
 * 网络状态
 */
export type NetworkState =
    | "online"    // 在线
    | "offline"   // 离线
    | "slow";     // 慢网络

/**
 * 离线状态信息
 */
export interface OfflineInfo {
    networkState: NetworkState;
    lastOnlineAt?: number;
    pendingSync: number;  // 待同步项数量
}
