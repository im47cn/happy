/**
 * @file 通知路由 Hook
 * @input expo-router, @/pwa/notificationRouter, @/pwa/serviceWorker
 * @output React Hook 用于集成通知路由与 Expo Router
 * @pos PWA 通知点击后的导航处理
 *
 * 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的 CLAUDE.md。
 */

import { useEffect, useCallback } from "react";
import { Platform } from "react-native";
import { useRouter } from "expo-router";
import { setRouterCallback, handleNotificationClick as routerHandleClick } from "@/pwa/notificationRouter";
import { onNotificationClick } from "@/pwa";
import type { NotificationData } from "@/pwa/types";

/**
 * 通知路由 Hook
 *
 * 在应用根布局中使用此 Hook 来处理推送通知点击后的路由跳转
 *
 * @example
 * ```tsx
 * // 在 app/_layout.tsx 中使用
 * import { useNotificationRouter } from "@/hooks/useNotificationRouter";
 *
 * function RootLayout() {
 *   useNotificationRouter();
 *   return <Slot />;
 * }
 * ```
 */
export function useNotificationRouter(): void {
    const router = useRouter();

    // 设置路由回调
    useEffect(() => {
        if (Platform.OS !== "web") {
            return;
        }

        // 注册 Expo Router 回调
        const unsubscribeRouter = setRouterCallback((config) => {
            console.log("[useNotificationRouter] Navigating with Expo Router:", config.path);
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                router.push(config.path as any);
            } catch (error) {
                console.warn("[useNotificationRouter] Navigation failed:", error);
                // 降级到浏览器导航
                if (typeof window !== "undefined") {
                    window.location.href = config.path;
                }
            }
        });

        return () => {
            unsubscribeRouter();
        };
    }, [router]);

    // 监听通知点击事件
    useEffect(() => {
        if (Platform.OS !== "web") {
            return;
        }

        const unsubscribe = onNotificationClick((url, data, action) => {
            console.log("[useNotificationRouter] Notification clicked:", { url, data, action });
            routerHandleClick(url, data, action);
        });

        return unsubscribe;
    }, []);
}

/**
 * 手动处理通知点击
 * 用于测试或程序化触发导航
 */
export function useNotificationNavigate(): (
    url: string,
    data?: NotificationData,
    action?: string
) => void {
    const router = useRouter();

    return useCallback(
        (url: string, data?: NotificationData, action?: string) => {
            if (Platform.OS !== "web") {
                console.warn("[useNotificationNavigate] Only available on web platform");
                return;
            }

            routerHandleClick(url, data, action);
        },
        [router]
    );
}
