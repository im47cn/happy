/**
 * @file PWA 运行模式检测 Hook
 * @input React hooks, Platform API, window.matchMedia
 * @output PWA 运行模式状态和检测工具
 * @pos 提供 PWA 安装状态、运行模式和设备类型检测
 *
 * 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的 CLAUDE.md。
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { Platform, useWindowDimensions } from "react-native";

// ============================================================================
// 类型定义
// ============================================================================

/**
 * PWA 运行模式
 */
export type PwaDisplayMode =
    | "browser"      // 普通浏览器模式
    | "standalone"   // 安装为 PWA 的独立模式
    | "fullscreen"   // 全屏模式
    | "minimal-ui"   // 最小 UI 模式
    | "window-controls-overlay"; // 窗口控制覆盖模式

/**
 * PWA 模式信息
 */
export interface PwaModeInfo {
    /** 当前显示模式 */
    displayMode: PwaDisplayMode;
    /** 是否为 standalone 或更高级模式（已安装 PWA） */
    isStandalone: boolean;
    /** 是否为触摸设备 */
    isTouchDevice: boolean;
    /** 是否为移动端 Web（包括 PWA） */
    isMobileWeb: boolean;
    /** 是否为桌面 Web */
    isDesktopWeb: boolean;
    /** 是否为 iOS */
    isIOS: boolean;
    /** 是否为 Android */
    isAndroid: boolean;
    /** 是否为 Web 平台 */
    isWeb: boolean;
    /** Safe Area Insets（仅在支持的环境中可用） */
    safeAreaInsets: SafeAreaInsets;
}

/**
 * Safe Area 边距
 */
export interface SafeAreaInsets {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

// ============================================================================
// 内部常量
// ============================================================================

/** 移动端断点宽度 */
const MOBILE_BREAKPOINT = 768;

// ============================================================================
// 检测函数
// ============================================================================

/**
 * 检测当前显示模式
 */
function detectDisplayMode(): PwaDisplayMode {
    if (typeof window === "undefined" || !window.matchMedia) {
        return "browser";
    }

    // 按优先级检测
    if (window.matchMedia("(display-mode: window-controls-overlay)").matches) {
        return "window-controls-overlay";
    }
    if (window.matchMedia("(display-mode: fullscreen)").matches) {
        return "fullscreen";
    }
    if (window.matchMedia("(display-mode: standalone)").matches) {
        return "standalone";
    }
    if (window.matchMedia("(display-mode: minimal-ui)").matches) {
        return "minimal-ui";
    }

    // iOS Safari standalone 模式检测
    if (typeof navigator !== "undefined" && "standalone" in navigator) {
        if ((navigator as Navigator & { standalone?: boolean }).standalone === true) {
            return "standalone";
        }
    }

    return "browser";
}

/**
 * 检测是否为触摸设备
 */
function detectTouchDevice(): boolean {
    if (typeof window === "undefined") return false;

    // 检测触摸能力
    if ("ontouchstart" in window) return true;
    if (navigator.maxTouchPoints > 0) return true;

    // 媒体查询检测
    if (window.matchMedia) {
        // hover: none 表示主要输入设备不支持悬停（触摸设备）
        if (window.matchMedia("(hover: none)").matches) return true;
        // pointer: coarse 表示主要输入设备是低精度的（如手指）
        if (window.matchMedia("(pointer: coarse)").matches) return true;
    }

    return false;
}

/**
 * 检测操作系统类型
 */
function detectOS(): { isIOS: boolean; isAndroid: boolean } {
    if (typeof navigator === "undefined") {
        return { isIOS: false, isAndroid: false };
    }

    const ua = navigator.userAgent || navigator.vendor || "";
    const isIOS = /iPad|iPhone|iPod/.test(ua) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isAndroid = /android/i.test(ua);

    return { isIOS, isAndroid };
}

/**
 * 获取 CSS Safe Area Insets
 * 注意：这需要在 DOM 中实际读取 CSS 变量
 */
function getSafeAreaInsets(): SafeAreaInsets {
    if (typeof document === "undefined") {
        return { top: 0, right: 0, bottom: 0, left: 0 };
    }

    const style = getComputedStyle(document.documentElement);

    const parseInset = (value: string): number => {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
    };

    return {
        top: parseInset(style.getPropertyValue("--sat")),
        right: parseInset(style.getPropertyValue("--sar")),
        bottom: parseInset(style.getPropertyValue("--sab")),
        left: parseInset(style.getPropertyValue("--sal")),
    };
}

// ============================================================================
// 非响应式 API（用于非 React 上下文）
// ============================================================================

/**
 * 检测是否以 standalone 模式运行（非响应式）
 */
export function isStandaloneMode(): boolean {
    if (Platform.OS !== "web") return false;
    const mode = detectDisplayMode();
    return mode === "standalone" || mode === "fullscreen" || mode === "window-controls-overlay";
}

/**
 * 检测是否为移动端 Web（非响应式）
 */
export function isMobileWeb(): boolean {
    if (Platform.OS !== "web") return false;
    if (typeof window === "undefined") return false;
    return window.innerWidth < MOBILE_BREAKPOINT || detectTouchDevice();
}

/**
 * 获取当前 PWA 模式信息（非响应式）
 */
export function getPwaModeInfo(): PwaModeInfo {
    const isWeb = Platform.OS === "web";
    const displayMode = isWeb ? detectDisplayMode() : "browser";
    const isTouchDevice = isWeb ? detectTouchDevice() : false;
    const { isIOS, isAndroid } = detectOS();
    const width = typeof window !== "undefined" ? window.innerWidth : 1024;

    return {
        displayMode,
        isStandalone: displayMode === "standalone" || displayMode === "fullscreen" || displayMode === "window-controls-overlay",
        isTouchDevice,
        isMobileWeb: isWeb && (width < MOBILE_BREAKPOINT || isTouchDevice),
        isDesktopWeb: isWeb && width >= MOBILE_BREAKPOINT && !isTouchDevice,
        isIOS,
        isAndroid,
        isWeb,
        safeAreaInsets: getSafeAreaInsets(),
    };
}

// ============================================================================
// React Hooks
// ============================================================================

/**
 * PWA 模式检测 Hook
 *
 * 提供响应式的 PWA 运行模式检测，包括：
 * - 显示模式（browser/standalone/fullscreen）
 * - 设备类型（触摸/移动端/桌面）
 * - 操作系统类型
 * - Safe Area Insets
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isStandalone, isMobileWeb, safeAreaInsets } = usePwaMode();
 *
 *   return (
 *     <View style={{
 *       paddingTop: isStandalone ? safeAreaInsets.top : 0,
 *       paddingBottom: isMobileWeb ? 16 : 8,
 *     }}>
 *       {isStandalone && <Text>Running as installed PWA</Text>}
 *     </View>
 *   );
 * }
 * ```
 */
export function usePwaMode(): PwaModeInfo {
    const { width } = useWindowDimensions();
    const isWeb = Platform.OS === "web";

    // 显示模式状态
    const [displayMode, setDisplayMode] = useState<PwaDisplayMode>(() =>
        isWeb ? detectDisplayMode() : "browser"
    );

    // 触摸设备检测
    const [isTouchDevice, setIsTouchDevice] = useState<boolean>(() =>
        isWeb ? detectTouchDevice() : false
    );

    // Safe Area Insets
    const [safeAreaInsets, setSafeAreaInsets] = useState<SafeAreaInsets>(() =>
        getSafeAreaInsets()
    );

    // 监听显示模式变化
    useEffect(() => {
        if (!isWeb || typeof window === "undefined" || !window.matchMedia) return;

        const modes: PwaDisplayMode[] = [
            "window-controls-overlay",
            "fullscreen",
            "standalone",
            "minimal-ui",
        ];

        const listeners: (() => void)[] = [];

        modes.forEach((mode) => {
            const query = window.matchMedia(`(display-mode: ${mode})`);
            const handler = () => {
                setDisplayMode(detectDisplayMode());
            };

            query.addEventListener("change", handler);
            listeners.push(() => query.removeEventListener("change", handler));
        });

        return () => {
            listeners.forEach((cleanup) => cleanup());
        };
    }, [isWeb]);

    // 监听触摸设备变化
    useEffect(() => {
        if (!isWeb || typeof window === "undefined" || !window.matchMedia) return;

        const hoverQuery = window.matchMedia("(hover: none)");
        const pointerQuery = window.matchMedia("(pointer: coarse)");

        const handler = () => {
            setIsTouchDevice(detectTouchDevice());
        };

        hoverQuery.addEventListener("change", handler);
        pointerQuery.addEventListener("change", handler);

        return () => {
            hoverQuery.removeEventListener("change", handler);
            pointerQuery.removeEventListener("change", handler);
        };
    }, [isWeb]);

    // 定期更新 Safe Area Insets（CSS 变量可能在 PWA 模式切换后变化）
    useEffect(() => {
        if (!isWeb) return;

        // 初始读取
        setSafeAreaInsets(getSafeAreaInsets());

        // 延迟再读取一次（某些浏览器需要时间应用 safe area）
        const timer = setTimeout(() => {
            setSafeAreaInsets(getSafeAreaInsets());
        }, 500);

        return () => clearTimeout(timer);
    }, [isWeb, displayMode]);

    // 计算派生状态
    const { isIOS, isAndroid } = useMemo(() => detectOS(), []);

    const isStandalone = useMemo(
        () =>
            displayMode === "standalone" ||
            displayMode === "fullscreen" ||
            displayMode === "window-controls-overlay",
        [displayMode]
    );

    const isMobileWeb = useMemo(
        () => isWeb && (width < MOBILE_BREAKPOINT || isTouchDevice),
        [isWeb, width, isTouchDevice]
    );

    const isDesktopWeb = useMemo(
        () => isWeb && width >= MOBILE_BREAKPOINT && !isTouchDevice,
        [isWeb, width, isTouchDevice]
    );

    return {
        displayMode,
        isStandalone,
        isTouchDevice,
        isMobileWeb,
        isDesktopWeb,
        isIOS,
        isAndroid,
        isWeb,
        safeAreaInsets,
    };
}

/**
 * 仅检测 standalone 模式的简化 Hook
 */
export function usePwaStandalone(): boolean {
    const { isStandalone } = usePwaMode();
    return isStandalone;
}

/**
 * 仅检测移动端 Web 的简化 Hook
 */
export function useIsMobileWeb(): boolean {
    const { isMobileWeb } = usePwaMode();
    return isMobileWeb;
}
