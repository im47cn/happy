# Notifications 模块

一旦我所属的文件夹有所变化，请更新我。

## 架构概述

原生推送通知和生物识别服务层，负责 iOS/Android 推送订阅、权限管理、生物识别认证和安全凭据存储。

## 文件清单

| 文件 | 地位 | 功能 |
|------|------|------|
| `index.ts` | 入口 | 模块统一导出 |
| `types.ts` | 类型 | 原生推送相关类型定义，复用 PWA 共享类型 |
| `pushService.ts` | 核心 | expo-notifications 集成、权限请求、Token 管理、服务器注册 |
| `biometricService.ts` | 核心 | expo-local-authentication 集成、生物识别认证、安全凭据存储 |

## 与 PWA 模块的关系

- **共享类型**: 通过 `@/pwa/types` 复用 `NotificationPayload`, `NotificationPreferences` 等
- **独立实现**: 原生使用 expo-notifications，PWA 使用 Web Push API
- **统一 API 端点**: 服务器端 `/v1/push/native/*` vs `/v1/web-push/*`

## 核心功能

### 推送通知初始化
```typescript
import { initializePushService } from '@/notifications';

// App 启动时调用
const status = await initializePushService();
```

### 推送订阅流程
```typescript
import { subscribeToPush } from '@/notifications';

// 完整流程：权限请求 → 获取 Token → 服务器注册
const status = await subscribeToPush();
```

### 生物识别认证
```typescript
import {
    checkBiometricAvailability,
    authenticateForApproval,
    biometricQuickLogin
} from '@/notifications';

// 检查可用性
const availability = await checkBiometricAvailability();

// 审批操作认证
const result = await authenticateForApproval('delete file');

// 快速登录（使用存储的凭据）
const loginResult = await biometricQuickLogin();
```

## Android 通知渠道

| 渠道 ID | 优先级 | 用途 |
|---------|--------|------|
| `approval_requests` | HIGH | CLI 审批请求（绕过勿扰） |
| `task_notifications` | DEFAULT | 任务完成通知 |
| `messages` | DEFAULT | 消息通知 |
| `system` | LOW | 系统公告 |

## iOS 通知类别

| 类别 | 操作按钮 |
|------|----------|
| `APPROVAL_REQUEST` | Approve, Reject, View Details |
| `TASK_COMPLETE` | Open Session, Dismiss |

## 生物识别类型

| 类型 | iOS | Android |
|------|-----|---------|
| `facial` | Face ID | Face Recognition |
| `fingerprint` | Touch ID | Fingerprint |
| `iris` | - | Iris Scanner |

## 依赖

- `expo-notifications` - 推送通知核心
- `expo-device` - 设备检测
- `expo-secure-store` - 安全存储设备 ID 和凭据
- `expo-constants` - EAS 项目配置
- `expo-local-authentication` - 生物识别认证
