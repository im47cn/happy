/**
 * @file 通知路由处理
 * @input types.ts (NotificationType, NotificationData)
 * @output 通知点击后的路由跳转逻辑
 * @pos 客户端通知路由管理，将通知类型映射到应用路由
 *
 * 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的 CLAUDE.md。
 */

import { Platform } from "react-native";
import type { NotificationType, NotificationData } from "./types";

// ============================================================================
// Types
// ============================================================================

/**
 * 路由配置
 */
export interface RouteConfig {
    /** 路由路径 */
    path: string;
    /** 路由参数 */
    params?: Record<string, string>;
}

/**
 * 路由回调类型
 */
export type RouterCallback = (config: RouteConfig) => void;

// ============================================================================
// State
// ============================================================================

let routerCallback: RouterCallback | null = null;

// ============================================================================
// Route Mapping
// ============================================================================

/**
 * 根据通知类型获取默认路由
 */
function getDefaultRouteForType(type: NotificationType): string {
    switch (type) {
        case "approval_request":
            return "/approvals";
        case "task_complete":
            return "/tasks";
        case "new_message":
            return "/messages";
        case "system":
            return "/notifications";
        default:
            return "/";
    }
}

/**
 * 根据通知数据生成路由配置
 */
export function getRouteFromNotification(data: NotificationData | undefined): RouteConfig {
    // 如果没有数据，返回首页
    if (!data) {
        return { path: "/" };
    }

    // 如果有明确的 URL，优先使用
    if (data.url) {
        return { path: data.url };
    }

    const { type, requestId, sessionId, messageId } = data;

    // 根据不同通知类型和数据生成路由
    switch (type) {
        case "approval_request":
            // 审批请求 - 跳转到具体审批页面或审批列表
            if (requestId) {
                return {
                    path: `/approval/${requestId}`,
                    params: { requestId },
                };
            }
            return { path: "/approvals" };

        case "task_complete":
            // 任务完成 - 跳转到会话或任务列表
            if (sessionId) {
                return {
                    path: `/session/${sessionId}`,
                    params: { id: sessionId },
                };
            }
            return { path: "/tasks" };

        case "new_message":
            // 新消息 - 跳转到会话
            if (sessionId) {
                return {
                    path: `/session/${sessionId}`,
                    params: { id: sessionId },
                };
            }
            return { path: "/" };

        case "system":
            // 系统通知 - 跳转到通知中心
            return { path: "/notifications" };

        default:
            return { path: getDefaultRouteForType(type) };
    }
}

// ============================================================================
// Router Integration
// ============================================================================

/**
 * 注册路由回调
 * 用于 React 组件中设置 Expo Router 导航
 *
 * @example
 * ```tsx
 * import { useRouter } from "expo-router";
 * import { setRouterCallback } from "@/pwa/notificationRouter";
 *
 * function App() {
 *   const router = useRouter();
 *
 *   useEffect(() => {
 *     const unsubscribe = setRouterCallback((config) => {
 *       router.push(config.path);
 *     });
 *     return unsubscribe;
 *   }, [router]);
 * }
 * ```
 */
export function setRouterCallback(callback: RouterCallback): () => void {
    routerCallback = callback;
    return () => {
        if (routerCallback === callback) {
            routerCallback = null;
        }
    };
}

/**
 * 执行路由导航
 */
export function navigateToRoute(config: RouteConfig): void {
    console.log("[NotificationRouter] Navigating to:", config.path);

    // 优先使用注册的路由回调（Expo Router）
    if (routerCallback) {
        try {
            routerCallback(config);
            return;
        } catch (error) {
            console.warn("[NotificationRouter] Router callback failed:", error);
        }
    }

    // 降级到浏览器原生导航（仅 Web 平台）
    if (Platform.OS === "web" && typeof window !== "undefined") {
        navigateWithBrowser(config.path);
    }
}

/**
 * 浏览器原生导航
 */
function navigateWithBrowser(path: string): void {
    if (typeof window === "undefined") {
        return;
    }

    // 使用 History API 进行单页应用导航
    if (window.history && typeof window.history.pushState === "function") {
        window.history.pushState(null, "", path);
        // 触发 popstate 事件以通知路由器
        window.dispatchEvent(new PopStateEvent("popstate"));
    } else {
        // 降级到完整页面导航
        window.location.href = path;
    }
}

// ============================================================================
// Notification Click Handler
// ============================================================================

/**
 * 处理通知点击
 * 解析通知数据并执行导航
 */
export function handleNotificationClick(
    url: string,
    data: NotificationData | undefined,
    action: string | undefined
): void {
    console.log("[NotificationRouter] Notification clicked:", { url, data, action });

    // 处理通知动作按钮
    if (action) {
        handleNotificationAction(action, data);
        return;
    }

    // 根据数据生成路由并导航
    const routeConfig = getRouteFromNotification(data);

    // 如果通知点击带有明确的 URL，优先使用
    if (url && url !== "/") {
        routeConfig.path = url;
    }

    navigateToRoute(routeConfig);
}

/**
 * 处理通知动作按钮
 */
function handleNotificationAction(
    action: string,
    data: NotificationData | undefined
): void {
    console.log("[NotificationRouter] Handling action:", action);

    switch (action) {
        case "approve":
            // 快速审批动作
            if (data?.requestId) {
                navigateToRoute({
                    path: `/approval/${data.requestId}`,
                    params: { action: "approve" },
                });
            }
            break;

        case "reject":
            // 快速拒绝动作
            if (data?.requestId) {
                navigateToRoute({
                    path: `/approval/${data.requestId}`,
                    params: { action: "reject" },
                });
            }
            break;

        case "view":
            // 查看详情
            if (data?.sessionId) {
                navigateToRoute({ path: `/session/${data.sessionId}` });
            } else if (data?.requestId) {
                navigateToRoute({ path: `/approval/${data.requestId}` });
            }
            break;

        case "reply":
            // 快速回复
            if (data?.sessionId) {
                navigateToRoute({
                    path: `/session/${data.sessionId}`,
                    params: { focus: "input" },
                });
            }
            break;

        case "dismiss":
            // 关闭通知 - 不做导航
            console.log("[NotificationRouter] Notification dismissed");
            break;

        default:
            // 未知动作，使用默认导航
            navigateToRoute(getRouteFromNotification(data));
    }
}

// ============================================================================
// URL Utilities
// ============================================================================

/**
 * 检查是否为内部路由
 */
export function isInternalRoute(url: string): boolean {
    if (!url) return false;

    // 相对路径是内部路由
    if (url.startsWith("/")) return true;

    // 检查是否为当前域名
    if (typeof window !== "undefined") {
        try {
            const urlObj = new URL(url, window.location.origin);
            return urlObj.origin === window.location.origin;
        } catch {
            return false;
        }
    }

    return false;
}

/**
 * 解析 URL 为路由配置
 */
export function parseUrlToRoute(url: string): RouteConfig {
    if (!url) {
        return { path: "/" };
    }

    // 相对路径直接使用
    if (url.startsWith("/")) {
        return { path: url };
    }

    // 解析绝对 URL
    try {
        const urlObj = new URL(url, typeof window !== "undefined" ? window.location.origin : "https://app.happycoder.dev");
        return { path: urlObj.pathname + urlObj.search };
    } catch {
        return { path: "/" };
    }
}
