# PWA Module

一旦我所属的文件夹有所变化，请更新我。

## 模块职责

渐进式 Web 应用功能模块，负责 PWA 安装、Service Worker 管理和 Web Push 订阅。

## 文件清单

| 文件名 | 地位 | 功能 |
|--------|------|------|
| `types.ts` | 核心 | TypeScript 类型定义 |
| `index.ts` | 入口 | 模块导出 |
| `serviceWorker.ts` | 功能 | Service Worker 注册、消息通信和 Badge 管理（已实现） |
| `install.ts` | 功能 | PWA 安装提示逻辑（已实现） |
| `pushSubscription.ts` | 功能 | Web Push 订阅管理（已实现） |
| `notificationRouter.ts` | 功能 | 通知路由处理，点击后导航（已实现） |
| `offlineManager.ts` | 功能 | 离线状态管理和 IndexedDB 存储（已实现） |
| `useNotificationSync.ts` | 功能 | 跨设备通知状态同步 Hook（已实现） |
| `usePwaMode.ts` | 功能 | PWA 运行模式检测 Hook（已实现） |
| `usePwaMode.spec.ts` | 测试 | PWA 运行模式单元测试 |
| `pushSubscription.spec.ts` | 测试 | Push 订阅管理单元测试 |
| `LOG_KEYWORDS.md` | 文档 | 日志关键字文档，便于调试 |
| `MANUAL_TESTING.md` | 文档 | 手工验收测试指南 |

## E2E 测试 (e2e/)

| 文件名 | 功能 |
|--------|------|
| `pwa-push.e2e.ts` | PWA 推送通知 E2E 测试脚本 |
| `playwright.config.ts` | Playwright 测试配置 |

## 静态资源 (public/)

| 文件名 | 功能 |
|--------|------|
| `manifest.json` | PWA Web App Manifest |
| `service-worker.js` | Service Worker 脚本 |
| `icon-192.png` | 192x192 PWA 图标 |
| `icon-512.png` | 512x512 PWA 图标 |
| `apple-touch-icon.png` | Apple Touch Icon |

## 依赖关系

- 复用 `@/sync/encryption/` 进行端到端加密
- 复用 `@/sync/apiSocket.ts` 的 WebSocket 通信
- 复用 `@/sync/serverConfig.ts` 获取服务器 URL
- 复用 `@/auth/tokenStorage.ts` 获取认证凭证
- 复用 `@/utils/time.ts` backoff 重试机制
- 复用 `@/modal` 模态框系统
- 复用 `@/text` 国际化系统

## 关联组件

| 文件路径 | 功能 |
|----------|------|
| `@/hooks/usePwaInstall.ts` | React hook，封装 install.ts 供组件使用 |
| `@/hooks/useOfflineStatus.ts` | React hook，封装 offlineManager.ts 供组件使用 |
| `@/hooks/useNotificationRouter.ts` | React hook，集成通知路由与 Expo Router |
| `@/components/PwaInstallBanner.tsx` | PWA 安装提示 UI 组件 |
| `@/components/OfflineStatusBanner.tsx` | 离线状态提示 UI 组件 |
| `@/components/web/PWANotificationSync.tsx` | 跨设备通知状态同步组件 |
