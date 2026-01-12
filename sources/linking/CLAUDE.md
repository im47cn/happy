# Linking 模块

一旦我所属的文件夹有所变化，请更新我。

## 架构概述

Deep Linking 服务层，负责 URL scheme 处理、Universal Links、深层链接解析和应用内导航触发。

## 文件清单

| 文件 | 地位 | 功能 |
|------|------|------|
| `index.ts` | 入口 | 模块统一导出 |
| `types.ts` | 类型 | Deep link 相关类型定义 |
| `linkingService.ts` | 核心 | expo-linking 集成、URL 解析、路由处理、外部链接打开 |

## 支持的 URL Schemes

| Scheme | 示例 | 用途 |
|--------|------|------|
| `happy://` | `happy://session/123` | 自定义 URL scheme |
| `https://` | `https://happy.coder.app/session/123` | Universal Links |

## 支持的深层链接路由

| 路由 | URL 格式 | 用途 |
|------|----------|------|
| `session` | `happy://session/:sessionId` | 打开指定会话 |
| `approval` | `happy://approval/:requestId` | 打开审批请求 |
| `settings` | `happy://settings` | 打开设置 |
| `settings/notifications` | `happy://settings/notifications` | 通知设置 |
| `settings/security` | `happy://settings/security` | 安全设置 |
| `connect` | `happy://connect?token=xxx` | QR 码连接 |

## 核心功能

### 初始化服务
```typescript
import { initializeLinkingService, registerRouteHandler } from '@/linking';

// 启动时初始化
await initializeLinkingService({
    defaultHandler: (event) => {
        console.log('Unhandled deep link:', event.link.url);
    },
});

// 注册路由处理器
registerRouteHandler('session', async (event) => {
    const sessionId = event.link.primaryId;
    // 导航到会话页面
    router.push(`/session/${sessionId}`);
});
```

### URL 解析
```typescript
import { parseUrl } from '@/linking';

const result = parseUrl('happy://session/abc123?tab=chat');
// {
//   url: 'happy://session/abc123?tab=chat',
//   scheme: 'happy',
//   route: 'session',
//   pathSegments: ['session', 'abc123'],
//   params: { tab: 'chat' },
//   primaryId: 'abc123'
// }
```

### 生成深层链接
```typescript
import { createSessionLink, createApprovalLink } from '@/linking';

const sessionLink = createSessionLink('abc123');
// 'happy://session/abc123'

const approvalLink = createApprovalLink('req456');
// 'happy://approval/req456'
```

### 打开外部 URL
```typescript
import { openUrl, openSettings, canOpenUrl } from '@/linking';

// 打开网页
await openUrl('https://example.com');

// 打开系统设置
await openSettings();

// 检查是否可打开
const canOpen = await canOpenUrl('mailto:test@example.com');
```

## 应用启动状态

| 状态 | 说明 |
|------|------|
| `cold` | 应用未运行，通过深层链接启动 |
| `background` | 应用在后台，通过深层链接唤醒 |
| `foreground` | 应用在前台，接收到深层链接 |

## Expo Router 集成

```typescript
import { createLinkingConfig } from '@/linking';

// 在 _layout.tsx 中配置
const linking = createLinkingConfig();
```

## 依赖

- `expo-linking` - Deep linking 核心
- `@/log` - 日志记录
