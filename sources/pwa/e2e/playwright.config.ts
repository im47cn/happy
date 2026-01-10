/**
 * @file Playwright E2E 测试配置
 * @input Playwright
 * @output 测试配置
 * @pos PWA E2E 测试配置
 */

import { defineConfig, devices } from "@playwright/test";

/**
 * 参考: https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
    testDir: ".",
    testMatch: "*.e2e.ts",

    /* 测试超时 */
    timeout: 30000,

    /* 期望超时 */
    expect: {
        timeout: 5000,
    },

    /* 失败时重试 */
    retries: process.env.CI ? 2 : 0,

    /* 并行测试（PWA 测试建议串行） */
    workers: 1,

    /* 报告 */
    reporter: [
        ["list"],
        ["html", { outputFolder: "../../../.playwright-report", open: "never" }],
    ],

    /* 共享配置 */
    use: {
        /* 基础 URL */
        baseURL: process.env.TEST_URL || "http://localhost:8081",

        /* 收集 trace */
        trace: "on-first-retry",

        /* 截图策略 */
        screenshot: "only-on-failure",

        /* 视频策略 */
        video: "on-first-retry",
    },

    /* 浏览器项目配置 */
    projects: [
        {
            name: "chromium",
            use: {
                ...devices["Desktop Chrome"],
                // PWA 测试需要 Service Worker 支持
                serviceWorkers: "allow",
                // 允许通知权限（测试需要）
                permissions: ["notifications"],
            },
        },
        {
            name: "Mobile Chrome",
            use: {
                ...devices["Pixel 5"],
                serviceWorkers: "allow",
                permissions: ["notifications"],
            },
        },
        // Firefox 不完全支持 Web Push，可选测试
        // {
        //     name: 'firefox',
        //     use: { ...devices['Desktop Firefox'] },
        // },
    ],

    /* 开发服务器配置（可选） */
    // webServer: {
    //     command: "yarn web",
    //     url: "http://localhost:8081",
    //     reuseExistingServer: !process.env.CI,
    //     timeout: 60000,
    // },
});
