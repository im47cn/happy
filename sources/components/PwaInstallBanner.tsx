/**
 * @file PWA 安装提示横幅组件
 * @input hooks/usePwaInstall.ts, pwa/install.ts
 * @output PWA 安装提示 UI 组件
 * @pos 在首页显示 PWA 安装提示，引导用户安装应用
 *
 * 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的 CLAUDE.md。
 */

import React, { useState, useCallback } from 'react';
import { View, Platform, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Item } from './Item';
import { ItemGroup } from './ItemGroup';
import { useUnistyles, StyleSheet } from 'react-native-unistyles';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { t } from '@/text';

/**
 * PWA 安装提示横幅
 * 在 Web 平台检测到可安装时显示安装提示
 */
export const PwaInstallBanner = React.memo(() => {
    const { theme } = useUnistyles();
    const { showPrompt, install, dismiss } = usePwaInstall();
    const [isInstalling, setIsInstalling] = useState(false);

    const handleInstall = useCallback(async () => {
        setIsInstalling(true);
        try {
            await install();
        } finally {
            setIsInstalling(false);
        }
    }, [install]);

    const handleDismiss = useCallback(() => {
        dismiss();
    }, [dismiss]);

    // 仅在 Web 平台且可安装时显示
    if (Platform.OS !== 'web' || !showPrompt) {
        return null;
    }

    return (
        <View testID="pwa-install-prompt">
            <ItemGroup>
                <View testID="pwa-install-button">
                    <Item
                        title={t('pwa.install.title')}
                        subtitle={t('pwa.install.message')}
                        subtitleLines={2}
                        icon={
                            <Ionicons
                                name="download-outline"
                                size={28}
                                color={theme.colors.header.tint}
                            />
                        }
                        rightElement={
                            <Pressable
                                style={styles.dismissButton}
                                onPress={handleDismiss}
                                testID="pwa-install-dismiss"
                            >
                                <Ionicons
                                    name="close"
                                    size={20}
                                    color={theme.colors.textSecondary}
                                />
                            </Pressable>
                        }
                        loading={isInstalling}
                        onPress={handleInstall}
                        showChevron={false}
                    />
                </View>
            </ItemGroup>
        </View>
    );
});

PwaInstallBanner.displayName = 'PwaInstallBanner';

const styles = StyleSheet.create((theme) => ({
    buttonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dismissButton: {
        padding: 4,
        borderRadius: 12,
    },
}));
