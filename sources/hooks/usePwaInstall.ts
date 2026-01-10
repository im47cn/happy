/**
 * @file PWA 安装状态 Hook
 * @input pwa/install.ts (initInstallPrompt, onInstallStateChange, etc.)
 * @output React hook 用于管理 PWA 安装状态
 * @pos 提供 React 组件所需的 PWA 安装状态和操作
 *
 * 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的 CLAUDE.md。
 */

import { useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import type { InstallState } from '@/pwa/types';
import {
    initInstallPrompt,
    onInstallStateChange,
    promptInstall,
    dismissInstallPrompt,
    shouldShowInstallPrompt,
} from '@/pwa/install';

interface UsePwaInstallReturn {
    /** 当前安装状态 */
    installState: InstallState;
    /** 是否应该显示安装提示 */
    showPrompt: boolean;
    /** 触发安装提示 */
    install: () => Promise<boolean>;
    /** 关闭安装提示 */
    dismiss: () => void;
    /** 是否为 Web 平台 */
    isWeb: boolean;
}

/**
 * PWA 安装状态管理 Hook
 * 初始化 PWA 安装提示监听，并提供安装状态和操作
 */
export function usePwaInstall(): UsePwaInstallReturn {
    const [installState, setInstallState] = useState<InstallState>('not_supported');
    const [showPrompt, setShowPrompt] = useState(false);
    const isWeb = Platform.OS === 'web';

    useEffect(() => {
        if (!isWeb) {
            return;
        }

        // 初始化 PWA 安装提示监听
        initInstallPrompt();

        // 监听状态变化
        const unsubscribe = onInstallStateChange((state) => {
            setInstallState(state);
            setShowPrompt(shouldShowInstallPrompt());
        });

        return unsubscribe;
    }, [isWeb]);

    const install = useCallback(async (): Promise<boolean> => {
        return promptInstall();
    }, []);

    const dismiss = useCallback((): void => {
        dismissInstallPrompt();
    }, []);

    return {
        installState,
        showPrompt,
        install,
        dismiss,
        isWeb,
    };
}
