/**
 * @file PWA 运行模式检测测试
 * @input usePwaMode.ts
 * @output 测试结果
 * @pos 验证 PWA 模式检测逻辑正确性
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
    isStandaloneMode,
    isMobileWeb,
    getPwaModeInfo,
    type PwaDisplayMode,
    type PwaModeInfo,
} from "./usePwaMode";

// ============================================================================
// Mock Setup
// ============================================================================

// Mock react-native Platform
vi.mock("react-native", () => ({
    Platform: { OS: "web" },
    useWindowDimensions: () => ({ width: 1024, height: 768 }),
}));

// 保存原始的 window 对象属性
const originalWindow = {
    matchMedia: window.matchMedia,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
};

// 创建 matchMedia mock
function createMatchMediaMock(matches: Record<string, boolean>) {
    return (query: string) => ({
        matches: matches[query] || false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    });
}

// ============================================================================
// 测试
// ============================================================================

describe("usePwaMode", () => {
    beforeEach(() => {
        // 重置 window 属性
        Object.defineProperty(window, "innerWidth", {
            writable: true,
            value: 1024,
        });
        Object.defineProperty(window, "innerHeight", {
            writable: true,
            value: 768,
        });

        // 默认 matchMedia - browser 模式
        window.matchMedia = createMatchMediaMock({});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // =========================================================================
    // isStandaloneMode 测试
    // =========================================================================

    describe("isStandaloneMode", () => {
        it("should return false in browser mode", () => {
            window.matchMedia = createMatchMediaMock({});
            expect(isStandaloneMode()).toBe(false);
        });

        it("should return true in standalone mode", () => {
            window.matchMedia = createMatchMediaMock({
                "(display-mode: standalone)": true,
            });
            expect(isStandaloneMode()).toBe(true);
        });

        it("should return true in fullscreen mode", () => {
            window.matchMedia = createMatchMediaMock({
                "(display-mode: fullscreen)": true,
            });
            expect(isStandaloneMode()).toBe(true);
        });

        it("should return true in window-controls-overlay mode", () => {
            window.matchMedia = createMatchMediaMock({
                "(display-mode: window-controls-overlay)": true,
            });
            expect(isStandaloneMode()).toBe(true);
        });

        it("should return false in minimal-ui mode", () => {
            window.matchMedia = createMatchMediaMock({
                "(display-mode: minimal-ui)": true,
            });
            expect(isStandaloneMode()).toBe(false);
        });
    });

    // =========================================================================
    // isMobileWeb 测试
    // =========================================================================

    describe("isMobileWeb", () => {
        it("should return true when width < 768", () => {
            Object.defineProperty(window, "innerWidth", {
                writable: true,
                value: 375,
            });
            window.matchMedia = createMatchMediaMock({});
            expect(isMobileWeb()).toBe(true);
        });

        it("should return false when width >= 768 and not touch device", () => {
            Object.defineProperty(window, "innerWidth", {
                writable: true,
                value: 1024,
            });
            // Remove touch-related properties from window
            delete (window as unknown as Record<string, unknown>).ontouchstart;
            Object.defineProperty(navigator, "maxTouchPoints", {
                writable: true,
                configurable: true,
                value: 0,
            });
            window.matchMedia = createMatchMediaMock({});
            expect(isMobileWeb()).toBe(false);
        });

        it("should return true when touch device regardless of width", () => {
            Object.defineProperty(window, "innerWidth", {
                writable: true,
                value: 1024,
            });
            window.matchMedia = createMatchMediaMock({
                "(hover: none)": true,
                "(pointer: coarse)": true,
            });
            expect(isMobileWeb()).toBe(true);
        });
    });

    // =========================================================================
    // getPwaModeInfo 测试
    // =========================================================================

    describe("getPwaModeInfo", () => {
        it("should return complete mode info object", () => {
            window.matchMedia = createMatchMediaMock({});
            const info = getPwaModeInfo();

            expect(info).toHaveProperty("displayMode");
            expect(info).toHaveProperty("isStandalone");
            expect(info).toHaveProperty("isTouchDevice");
            expect(info).toHaveProperty("isMobileWeb");
            expect(info).toHaveProperty("isDesktopWeb");
            expect(info).toHaveProperty("isIOS");
            expect(info).toHaveProperty("isAndroid");
            expect(info).toHaveProperty("isWeb");
            expect(info).toHaveProperty("safeAreaInsets");
        });

        it("should detect browser mode correctly", () => {
            window.matchMedia = createMatchMediaMock({});
            const info = getPwaModeInfo();

            expect(info.displayMode).toBe("browser");
            expect(info.isStandalone).toBe(false);
        });

        it("should detect standalone mode correctly", () => {
            window.matchMedia = createMatchMediaMock({
                "(display-mode: standalone)": true,
            });
            const info = getPwaModeInfo();

            expect(info.displayMode).toBe("standalone");
            expect(info.isStandalone).toBe(true);
        });

        it("should detect desktop web correctly", () => {
            Object.defineProperty(window, "innerWidth", {
                writable: true,
                value: 1024,
            });
            // Remove touch-related properties for desktop detection
            delete (window as unknown as Record<string, unknown>).ontouchstart;
            Object.defineProperty(navigator, "maxTouchPoints", {
                writable: true,
                configurable: true,
                value: 0,
            });
            window.matchMedia = createMatchMediaMock({});
            const info = getPwaModeInfo();

            expect(info.isDesktopWeb).toBe(true);
            expect(info.isMobileWeb).toBe(false);
        });

        it("should detect mobile web correctly", () => {
            Object.defineProperty(window, "innerWidth", {
                writable: true,
                value: 375,
            });
            window.matchMedia = createMatchMediaMock({});
            const info = getPwaModeInfo();

            expect(info.isDesktopWeb).toBe(false);
            expect(info.isMobileWeb).toBe(true);
        });

        it("should return safe area insets", () => {
            const info = getPwaModeInfo();

            expect(info.safeAreaInsets).toEqual({
                top: expect.any(Number),
                right: expect.any(Number),
                bottom: expect.any(Number),
                left: expect.any(Number),
            });
        });
    });

    // =========================================================================
    // Display Mode Priority 测试
    // =========================================================================

    describe("display mode priority", () => {
        it("should prioritize window-controls-overlay over other modes", () => {
            window.matchMedia = createMatchMediaMock({
                "(display-mode: window-controls-overlay)": true,
                "(display-mode: fullscreen)": true,
                "(display-mode: standalone)": true,
            });
            const info = getPwaModeInfo();
            expect(info.displayMode).toBe("window-controls-overlay");
        });

        it("should prioritize fullscreen over standalone", () => {
            window.matchMedia = createMatchMediaMock({
                "(display-mode: fullscreen)": true,
                "(display-mode: standalone)": true,
            });
            const info = getPwaModeInfo();
            expect(info.displayMode).toBe("fullscreen");
        });

        it("should prioritize standalone over minimal-ui", () => {
            window.matchMedia = createMatchMediaMock({
                "(display-mode: standalone)": true,
                "(display-mode: minimal-ui)": true,
            });
            const info = getPwaModeInfo();
            expect(info.displayMode).toBe("standalone");
        });
    });
});

// ============================================================================
// iOS Safari Standalone 测试
// ============================================================================

describe("iOS Safari standalone detection", () => {
    it("should detect iOS Safari standalone mode via navigator.standalone", () => {
        // Mock navigator.standalone
        Object.defineProperty(navigator, "standalone", {
            value: true,
            writable: true,
            configurable: true,
        });

        window.matchMedia = createMatchMediaMock({});
        const info = getPwaModeInfo();

        expect(info.displayMode).toBe("standalone");
        expect(info.isStandalone).toBe(true);

        // Cleanup
        Object.defineProperty(navigator, "standalone", {
            value: undefined,
            writable: true,
            configurable: true,
        });
    });
});

// ============================================================================
// Touch Device Detection 测试
// ============================================================================

describe("touch device detection", () => {
    it("should detect touch via hover: none media query", () => {
        window.matchMedia = createMatchMediaMock({
            "(hover: none)": true,
        });
        const info = getPwaModeInfo();
        expect(info.isTouchDevice).toBe(true);
    });

    it("should detect touch via pointer: coarse media query", () => {
        window.matchMedia = createMatchMediaMock({
            "(pointer: coarse)": true,
        });
        const info = getPwaModeInfo();
        expect(info.isTouchDevice).toBe(true);
    });

    it("should detect non-touch device", () => {
        // Remove touch-related properties
        delete (window as unknown as Record<string, unknown>).ontouchstart;
        Object.defineProperty(navigator, "maxTouchPoints", {
            writable: true,
            configurable: true,
            value: 0,
        });
        window.matchMedia = createMatchMediaMock({
            "(hover: hover)": true,
            "(pointer: fine)": true,
        });
        const info = getPwaModeInfo();
        expect(info.isTouchDevice).toBe(false);
    });
});
