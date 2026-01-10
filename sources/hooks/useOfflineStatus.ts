/**
 * @file 离线状态 React Hook
 * @input @/pwa/offlineManager
 * @output useOfflineStatus hook 供组件使用
 * @pos 桥接 offlineManager 和 React 组件
 *
 * 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的 CLAUDE.md。
 */

import { useState, useEffect, useCallback } from "react";
import { Platform } from "react-native";
import type { NetworkState, OfflineInfo } from "@/pwa/types";
import {
    initOfflineManager,
    getNetworkState,
    onNetworkStateChange,
    getOfflineInfo,
    onOfflineInfoChange,
    triggerSync,
} from "@/pwa/offlineManager";

/**
 * 离线状态 Hook 返回值
 */
export interface UseOfflineStatusResult {
    /** 是否正在初始化 */
    isInitializing: boolean;
    /** 网络状态: online | offline | slow */
    networkState: NetworkState;
    /** 是否在线 */
    isOnline: boolean;
    /** 是否离线 */
    isOffline: boolean;
    /** 是否慢网络 */
    isSlow: boolean;
    /** 离线详情信息 */
    offlineInfo: OfflineInfo | null;
    /** 待同步项数量 */
    pendingSyncCount: number;
    /** 手动触发同步 */
    sync: () => Promise<boolean>;
}

/**
 * 离线状态 Hook
 *
 * 仅在 Web 平台生效，其他平台返回默认在线状态
 *
 * @example
 * ```tsx
 * const { isOffline, pendingSyncCount, sync } = useOfflineStatus();
 *
 * if (isOffline) {
 *   return <OfflineBanner pendingCount={pendingSyncCount} />;
 * }
 * ```
 */
export function useOfflineStatus(): UseOfflineStatusResult {
    const [isInitializing, setIsInitializing] = useState(true);
    const [networkState, setNetworkState] = useState<NetworkState>("online");
    const [offlineInfo, setOfflineInfo] = useState<OfflineInfo | null>(null);

    // 初始化
    useEffect(() => {
        // 非 Web 平台不需要初始化
        if (Platform.OS !== "web") {
            setIsInitializing(false);
            return;
        }

        let mounted = true;

        const init = async () => {
            await initOfflineManager();

            if (!mounted) return;

            // 获取初始状态
            setNetworkState(getNetworkState());
            const info = await getOfflineInfo();
            if (mounted) {
                setOfflineInfo(info);
                setIsInitializing(false);
            }
        };

        init();

        // 监听网络状态变化
        const unsubNetwork = onNetworkStateChange((state) => {
            if (mounted) {
                setNetworkState(state);
            }
        });

        // 监听离线信息变化
        const unsubInfo = onOfflineInfoChange((info) => {
            if (mounted) {
                setOfflineInfo(info);
            }
        });

        return () => {
            mounted = false;
            unsubNetwork();
            unsubInfo();
        };
    }, []);

    // 手动触发同步
    const sync = useCallback(async () => {
        if (Platform.OS !== "web") {
            return true;
        }
        return triggerSync();
    }, []);

    // 计算派生状态
    const isOnline = networkState === "online";
    const isOffline = networkState === "offline";
    const isSlow = networkState === "slow";
    const pendingSyncCount = offlineInfo?.pendingSync ?? 0;

    return {
        isInitializing,
        networkState,
        isOnline,
        isOffline,
        isSlow,
        offlineInfo,
        pendingSyncCount,
        sync,
    };
}
