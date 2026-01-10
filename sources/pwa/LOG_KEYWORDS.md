# PWA 模块日志关键字文档

一旦我所属的文件夹有所变化，请更新我。

## 日志前缀说明

| 前缀 | 模块 | 说明 |
|------|------|------|
| `[PWA]` | serviceWorker.ts, useNotificationSync.ts | Service Worker 管理和通知同步 |
| `[ServiceWorker]` | service-worker.js | Service Worker 脚本内部日志 |
| `[OfflineManager]` | offlineManager.ts | 离线存储和网络状态管理 |
| `[NotificationRouter]` | notificationRouter.ts | 通知点击路由处理 |
| `[PushSubscription]` | pushSubscription.ts | Web Push 订阅管理 |

---

## [PWA] - Service Worker 管理

### serviceWorker.ts

| 日志 | 级别 | 触发场景 |
|------|------|----------|
| `[PWA] Service Worker not supported` | log | 浏览器不支持 Service Worker |
| `[PWA] Registering Service Worker...` | log | 开始注册 Service Worker |
| `[PWA] Service Worker registered:` | log | 注册成功，显示 scope |
| `[PWA] Service Worker registration failed:` | error | 注册失败 |
| `[PWA] Service Worker unregistered` | log | 取消注册成功 |
| `[PWA] Service Worker unregistration failed:` | error | 取消注册失败 |
| `[PWA] Update check failed:` | error | 检查更新失败 |
| `[PWA] No active Service Worker to send message` | warn | 尝试发送消息但无活跃 SW |
| `[PWA] closeNotification requires either tag or requestId` | warn | 关闭通知参数缺失 |
| `[PWA] closeNotifications requires tags or requestIds` | warn | 批量关闭通知参数缺失 |
| `[PWA] Service Worker update found` | log | 发现新版本 |
| `[PWA] Installing worker state:` | log | 新 SW 安装状态变化 |
| `[PWA] New Service Worker waiting` | log | 新 SW 等待激活 |
| `[PWA] Periodic update check failed:` | warn | 定期检查更新失败 |
| `[PWA] Unknown message from Service Worker:` | log | 收到未知类型消息 |
| `[PWA] Notification dismissed:` | log | 通知被关闭 |
| `[PWA] Push subscription changed:` | log | 推送订阅变更 |
| `[PWA] Push subscription expired:` | log | 推送订阅过期 |
| `[PWA] Silent push received:` | log | 收到静默推送 |
| `[PWA] Background sync triggered:` | log | 触发后台同步 |
| `[PWA] Message from Service Worker:` | log | 收到 SW 消息 |
| `[PWA] Controller changed, reloading...` | log | SW 控制器变更，重载页面 |
| `[PWA] Notification click:` | log | 通知点击事件 |

### useNotificationSync.ts

| 日志 | 级别 | 触发场景 |
|------|------|----------|
| `[PWA] Closing notifications for completed requests:` | log | 关闭已完成请求的通知 |
| `[PWA] Updating badge count:` | log | 更新徽章计数 |
| `[PWA] Syncing badge with pending requests:` | log | 同步徽章与待处理请求数 |

### install.ts

| 日志 | 级别 | 触发场景 |
|------|------|----------|
| `[PWA] Install prompt captured` | log | 捕获安装提示事件 |
| `[PWA] App was installed` | log | 应用已安装 |
| `[PWA] No install prompt available` | warn | 无可用安装提示 |
| `[PWA] User accepted the install prompt` | log | 用户接受安装 |
| `[PWA] User dismissed the install prompt` | log | 用户拒绝安装 |
| `[PWA] Install prompt error:` | error | 安装提示出错 |
| `[PWA] Install prompt dismissed by user` | log | 用户关闭安装提示 |

---

## [ServiceWorker] - Service Worker 内部

### service-worker.js

| 日志 | 级别 | 触发场景 |
|------|------|----------|
| `[ServiceWorker] Install` | log | SW 安装事件 |
| `[ServiceWorker] Pre-caching static resources` | log | 预缓存静态资源 |
| `[ServiceWorker] Pre-cache failed:` | error | 预缓存失败 |
| `[ServiceWorker] Activate` | log | SW 激活事件 |
| `[ServiceWorker] Deleting old cache:` | log | 删除旧缓存 |
| `[ServiceWorker] Cache first fetch failed:` | error | 缓存优先策略失败 |
| `[ServiceWorker] Network first failed, trying cache` | log | 网络优先回退到缓存 |
| `[ServiceWorker] Push received` | log | 收到推送消息 |
| `[ServiceWorker] Push has no data` | log | 推送无数据 |
| `[ServiceWorker] Failed to parse push data:` | error | 解析推送数据失败 |
| `[ServiceWorker] Raw push data:` | log | 原始推送数据（解析失败时） |
| `[ServiceWorker] Silent push - triggering background sync` | log | 静默推送触发后台同步 |
| `[ServiceWorker] Handling silent push:` | log | 处理静默推送 |
| `[ServiceWorker] Background sync registration failed:` | error | 后台同步注册失败 |
| `[ServiceWorker] Badge updated:` | log | 徽章更新成功 |
| `[ServiceWorker] Failed to update badge:` | error | 徽章更新失败 |
| `[ServiceWorker] Notification clicked:` | log | 通知点击（含 action） |
| `[ServiceWorker] Notification dismissed` | log | 通知被关闭 |
| `[ServiceWorker] Message received:` | log | 收到页面消息 |
| `[ServiceWorker] Unknown message type:` | log | 未知消息类型 |
| `[ServiceWorker] Push subscription changed` | log | 推送订阅变更事件 |
| `[ServiceWorker] Re-subscribed successfully` | log | 重新订阅成功 |
| `[ServiceWorker] Failed to re-subscribe:` | error | 重新订阅失败 |
| `[ServiceWorker] Notification closed` | log | 通知关闭事件 |
| `[ServiceWorker] Sync event:` | log | 同步事件触发 |

---

## [OfflineManager] - 离线管理

### offlineManager.ts

| 日志 | 级别 | 触发场景 |
|------|------|----------|
| `[OfflineManager] IndexedDB not supported` | log | 浏览器不支持 IndexedDB |
| `[OfflineManager] Failed to open database:` | error | 打开数据库失败 |
| `[OfflineManager] Database opened successfully` | log | 数据库打开成功 |
| `[OfflineManager] Database schema created` | log | 数据库结构创建完成 |
| `[OfflineManager] Database not initialized` | warn | 数据库未初始化 |
| `[OfflineManager] Added pending sync item:` | log | 添加待同步项 |
| `[OfflineManager] Failed to add pending sync:` | error | 添加待同步项失败 |
| `[OfflineManager] Failed to get pending sync items:` | error | 获取待同步列表失败 |
| `[OfflineManager] Removed pending sync item:` | log | 移除待同步项 |
| `[OfflineManager] Failed to remove pending sync:` | error | 移除待同步项失败 |
| `[OfflineManager] Max retries reached, removing item:` | log | 达到最大重试次数，移除项 |
| `[OfflineManager] Cleared all pending sync items` | log | 清空所有待同步项 |
| `[OfflineManager] Saved local subscription` | log | 保存本地订阅 |
| `[OfflineManager] Failed to save subscription:` | error | 保存订阅失败 |
| `[OfflineManager] Removed local subscription` | log | 移除本地订阅 |
| `[OfflineManager] Cleaned expired cache:` | log | 清理过期缓存 |
| `[OfflineManager] Network state monitor initialized:` | log | 网络状态监控初始化 |
| `[OfflineManager] Network state changed:` | log | 网络状态变化 |
| `[OfflineManager] Cannot sync while offline` | log | 离线状态无法同步 |
| `[OfflineManager] No sync handler registered` | warn | 未注册同步处理器 |
| `[OfflineManager] Starting sync...` | log | 开始同步 |
| `[OfflineManager] Sync interrupted: went offline` | log | 同步中断（网络断开） |
| `[OfflineManager] Sync item failed:` | error | 单项同步失败 |
| `[OfflineManager] Sync completed:` | log | 同步完成（success/partial） |

---

## [NotificationRouter] - 通知路由

### notificationRouter.ts

| 日志 | 级别 | 触发场景 |
|------|------|----------|
| `[NotificationRouter] Navigating to:` | log | 执行路由导航 |
| `[NotificationRouter] Router callback failed:` | warn | 路由回调执行失败 |
| `[NotificationRouter] Notification clicked:` | log | 通知点击事件 |
| `[NotificationRouter] Handling action:` | log | 处理通知 action |
| `[NotificationRouter] Notification dismissed` | log | 通知被关闭 |

---

## [PushSubscription] - 推送订阅

### pushSubscription.ts

| 日志 | 级别 | 触发场景 |
|------|------|----------|
| `[PushSubscription] Generated new device ID:` | log | 生成新设备 ID |
| `[PushSubscription] Failed to get VAPID key:` | error | 获取 VAPID 公钥失败 |
| `[PushSubscription] Got VAPID public key` | log | 获取 VAPID 公钥成功 |
| `[PushSubscription] Error getting VAPID key:` | error | 获取 VAPID 异常 |
| `[PushSubscription] Error getting subscription status:` | error | 获取订阅状态异常 |
| `[PushSubscription] Notification permission:` | log | 通知权限状态 |
| `[PushSubscription] Error requesting permission:` | error | 请求权限异常 |
| `[PushSubscription] Created new push subscription` | log | 创建新推送订阅 |
| `[PushSubscription] Added subscription to pending sync queue` | log | 订阅加入待同步队列 |
| `[PushSubscription] Error subscribing to push:` | error | 订阅推送异常 |
| `[PushSubscription] Unsubscribed from push notifications` | log | 取消订阅成功 |
| `[PushSubscription] Added unsubscribe to pending sync queue` | log | 取消订阅加入待同步队列 |
| `[PushSubscription] Error unsubscribing from push:` | error | 取消订阅异常 |
| `[PushSubscription] Added preferences update to pending sync queue` | log | 偏好更新加入待同步队列 |
| `[PushSubscription] No credentials for server sync` | warn | 无凭证无法同步服务器 |
| `[PushSubscription] Subscription synced to server:` | log | 订阅同步到服务器成功 |
| `[PushSubscription] Failed to sync subscription to server:` | error | 订阅同步到服务器失败 |
| `[PushSubscription] Unsubscribe synced to server` | log | 取消订阅同步到服务器成功 |
| `[PushSubscription] Failed to sync unsubscribe to server:` | error | 取消订阅同步失败 |
| `[PushSubscription] Preferences synced to server` | log | 偏好同步到服务器成功 |
| `[PushSubscription] Failed to sync preferences to server:` | error | 偏好同步失败 |
| `[PushSubscription] Failed to get server subscriptions:` | error | 获取服务器订阅列表失败 |
| `[PushSubscription] Unknown sync item type:` | warn | 未知同步项类型 |
| `[PushSubscription] Initialized with status:` | log | 初始化完成 |

---

## 调试指南

### 过滤特定模块日志

```javascript
// 浏览器控制台过滤
// 只看 Service Worker 相关
filter: [ServiceWorker]

// 只看推送订阅相关
filter: [PushSubscription]

// 只看离线管理相关
filter: [OfflineManager]
```

### 常见问题排查

| 问题 | 关键日志 |
|------|----------|
| SW 注册失败 | `[PWA] Service Worker registration failed:` |
| 推送订阅失败 | `[PushSubscription] Error subscribing to push:` |
| 通知不显示 | `[ServiceWorker] Push received` + `[ServiceWorker] Failed to parse push data:` |
| 离线功能异常 | `[OfflineManager] Failed to open database:` |
| 通知点击无响应 | `[NotificationRouter] Router callback failed:` |
| Badge 不更新 | `[ServiceWorker] Failed to update badge:` |

### 日志级别说明

- **log**: 正常操作记录，用于追踪流程
- **warn**: 非致命问题，功能可能受限
- **error**: 严重错误，需要关注和修复
