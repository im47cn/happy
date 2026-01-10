/**
 * @file PWA 安装提示管理
 * @input types.ts (BeforeInstallPromptEvent, InstallState, InstallPromptInfo)
 * @output PWA 安装状态检测、提示显示、安装触发等功能
 * @pos 负责 PWA 安装提示的捕获、存储和触发
 *
 * 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的 CLAUDE.md。
 */

import { Platform } from "react-native";
import type { BeforeInstallPromptEvent, InstallState, InstallPromptInfo } from "./types";

// ============================================================================
// 常量
// ============================================================================

/** localStorage key for dismissed state */
const INSTALL_DISMISSED_KEY = "pwa-install-dismissed";

/** localStorage key for dismissed timestamp */
const INSTALL_DISMISSED_AT_KEY = "pwa-install-dismissed-at";

/** 关闭提示后多久可以再次显示（7天） */
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

// ============================================================================
// 内部状态
// ============================================================================

/** 缓存的 BeforeInstallPromptEvent */
let deferredPrompt: BeforeInstallPromptEvent | null = null;

/** 当前安装状态 */
let currentState: InstallState = "not_supported";

/** 状态变更监听器 */
const stateListeners: Set<(state: InstallState) => void> = new Set();

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 检测是否为 Web 平台
 */
function isWebPlatform(): boolean {
    return Platform.OS === "web";
}

/**
 * 检测是否已安装为 PWA
 */
function isInstalledAsPwa(): boolean {
    if (!isWebPlatform()) return false;

    // 检测 standalone 模式
    if (typeof window !== "undefined" && window.matchMedia) {
        const standaloneQuery = window.matchMedia("(display-mode: standalone)");
        if (standaloneQuery.matches) return true;
    }

    // iOS Safari standalone 模式检测
    if (typeof navigator !== "undefined" && "standalone" in navigator) {
        return (navigator as Navigator & { standalone?: boolean }).standalone === true;
    }

    return false;
}

/**
 * 检测用户是否已关闭安装提示
 */
function isDismissed(): boolean {
    if (typeof localStorage === "undefined") return false;

    const dismissed = localStorage.getItem(INSTALL_DISMISSED_KEY);
    if (dismissed !== "true") return false;

    // 检查是否已过期
    const dismissedAtStr = localStorage.getItem(INSTALL_DISMISSED_AT_KEY);
    if (!dismissedAtStr) return false;

    const dismissedAt = parseInt(dismissedAtStr, 10);
    if (isNaN(dismissedAt)) return false;

    const now = Date.now();
    if (now - dismissedAt > DISMISS_DURATION_MS) {
        // 过期了，清除状态
        localStorage.removeItem(INSTALL_DISMISSED_KEY);
        localStorage.removeItem(INSTALL_DISMISSED_AT_KEY);
        return false;
    }

    return true;
}

/**
 * 更新状态并通知监听器
 */
function setState(state: InstallState): void {
    if (currentState === state) return;
    currentState = state;
    stateListeners.forEach(listener => listener(state));
}

// ============================================================================
// 公共 API
// ============================================================================

/**
 * 检测是否支持 PWA 安装
 */
export function isPwaInstallSupported(): boolean {
    if (!isWebPlatform()) return false;
    // beforeinstallprompt 事件表明支持安装
    return deferredPrompt !== null;
}

/**
 * 获取当前安装状态
 */
export function getInstallState(): InstallState {
    return currentState;
}

/**
 * 获取完整的安装提示信息
 */
export function getInstallPromptInfo(): InstallPromptInfo {
    const dismissedAtStr = localStorage?.getItem(INSTALL_DISMISSED_AT_KEY);
    const dismissedAt = dismissedAtStr ? parseInt(dismissedAtStr, 10) : undefined;

    return {
        state: currentState,
        promptEvent: deferredPrompt ?? undefined,
        dismissedAt: isNaN(dismissedAt ?? NaN) ? undefined : dismissedAt,
    };
}

/**
 * 初始化 PWA 安装提示监听
 * 应在应用启动时调用
 */
export function initInstallPrompt(): void {
    if (!isWebPlatform()) {
        setState("not_supported");
        return;
    }

    // 检测是否已安装
    if (isInstalledAsPwa()) {
        setState("installed");
        return;
    }

    // 检测是否已关闭
    if (isDismissed()) {
        setState("dismissed");
        return;
    }

    // 监听 beforeinstallprompt 事件
    window.addEventListener("beforeinstallprompt", (e: Event) => {
        // 阻止默认的安装提示
        e.preventDefault();
        // 保存事件以便稍后触发
        deferredPrompt = e as BeforeInstallPromptEvent;
        setState("installable");
        console.log("[PWA] Install prompt captured");
    });

    // 监听 appinstalled 事件
    window.addEventListener("appinstalled", () => {
        deferredPrompt = null;
        setState("installed");
        console.log("[PWA] App was installed");
    });

    // 监听 display-mode 变化
    if (window.matchMedia) {
        const standaloneQuery = window.matchMedia("(display-mode: standalone)");
        standaloneQuery.addEventListener("change", (e) => {
            if (e.matches) {
                setState("installed");
            }
        });
    }
}

/**
 * 触发 PWA 安装提示
 * @returns Promise<boolean> - 用户是否接受安装
 */
export async function promptInstall(): Promise<boolean> {
    if (!deferredPrompt) {
        console.warn("[PWA] No install prompt available");
        return false;
    }

    try {
        // 显示安装提示
        await deferredPrompt.prompt();

        // 等待用户响应
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
            console.log("[PWA] User accepted the install prompt");
            deferredPrompt = null;
            setState("installed");
            return true;
        } else {
            console.log("[PWA] User dismissed the install prompt");
            return false;
        }
    } catch (error) {
        console.error("[PWA] Install prompt error:", error);
        return false;
    }
}

/**
 * 关闭安装提示（用户主动关闭）
 * 记录关闭时间，一段时间后可再次显示
 */
export function dismissInstallPrompt(): void {
    if (typeof localStorage === "undefined") return;

    localStorage.setItem(INSTALL_DISMISSED_KEY, "true");
    localStorage.setItem(INSTALL_DISMISSED_AT_KEY, Date.now().toString());
    setState("dismissed");
    console.log("[PWA] Install prompt dismissed by user");
}

/**
 * 重置关闭状态（用于测试或设置页面）
 */
export function resetDismissedState(): void {
    if (typeof localStorage === "undefined") return;

    localStorage.removeItem(INSTALL_DISMISSED_KEY);
    localStorage.removeItem(INSTALL_DISMISSED_AT_KEY);

    // 如果有保存的 prompt，恢复为可安装状态
    if (deferredPrompt) {
        setState("installable");
    }
}

/**
 * 监听安装状态变化
 * @returns 取消监听的函数
 */
export function onInstallStateChange(listener: (state: InstallState) => void): () => void {
    stateListeners.add(listener);
    // 立即通知当前状态
    listener(currentState);
    return () => {
        stateListeners.delete(listener);
    };
}

/**
 * 检测是否应该显示安装提示
 * 综合考虑：平台、安装状态、关闭状态
 */
export function shouldShowInstallPrompt(): boolean {
    return currentState === "installable";
}
