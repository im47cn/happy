/**
 * @file 离线状态提示横幅组件
 * @input hooks/useOfflineStatus.ts, @/pwa
 * @output 离线状态提示 UI 组件
 * @pos 在首页显示离线状态提示，告知用户当前网络状况
 *
 * 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的 CLAUDE.md。
 */

import React from "react";
import { View, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Item } from "./Item";
import { ItemGroup } from "./ItemGroup";
import { useUnistyles } from "react-native-unistyles";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { t } from "@/text";

/**
 * 离线状态提示横幅
 * 在 Web 平台检测到离线或慢网络时显示提示
 */
export const OfflineStatusBanner = React.memo(() => {
    const { theme } = useUnistyles();
    const { isOffline, isSlow, pendingSyncCount, sync, isInitializing } = useOfflineStatus();

    // 仅在 Web 平台显示
    if (Platform.OS !== "web") {
        return null;
    }

    // 初始化中不显示
    if (isInitializing) {
        return null;
    }

    // 显示离线状态
    if (isOffline) {
        return (
            <View testID="offline-status-banner">
                <ItemGroup>
                    <Item
                        title={t("pwa.offline.title")}
                        subtitle={
                            pendingSyncCount > 0
                                ? `${t("pwa.offline.message")} (${pendingSyncCount} pending)`
                                : t("pwa.offline.message")
                        }
                        subtitleLines={2}
                        icon={
                            <Ionicons
                                name="cloud-offline-outline"
                                size={28}
                                color={theme.colors.warning}
                            />
                        }
                        showChevron={false}
                    />
                </ItemGroup>
            </View>
        );
    }

    // 显示慢网络状态
    if (isSlow) {
        return (
            <View testID="slow-network-banner">
                <ItemGroup>
                    <Item
                        title={t("pwa.offline.reconnecting")}
                        subtitle={t("pwa.offline.message")}
                        subtitleLines={2}
                        icon={
                            <Ionicons
                                name="cloud-outline"
                                size={28}
                                color={theme.colors.textSecondary}
                            />
                        }
                        showChevron={false}
                    />
                </ItemGroup>
            </View>
        );
    }

    // 在线时不显示
    return null;
});

OfflineStatusBanner.displayName = "OfflineStatusBanner";
