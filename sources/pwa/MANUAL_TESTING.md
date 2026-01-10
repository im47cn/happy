# PWA 推送通知手工验收指南

一旦我所属的文件夹有所变化，请更新我。

## 环境准备

```bash
# 1. 启动服务端
cd happy-server
yarn dev

# 2. 启动客户端 (Web)
cd happy
yarn web
```

访问地址：`http://localhost:8081`

---

## 测试清单

### 1. PWA 安装功能

| 步骤 | 操作 | 预期结果 | 日志关键字 |
|------|------|----------|-----------|
| 1.1 | 用 Chrome 打开 `localhost:8081` | 地址栏出现安装图标 | `[PWA] Service Worker registered` |
| 1.2 | 点击安装图标 | 弹出安装对话框 | `[PWA] Install prompt captured` |
| 1.3 | 确认安装 | 应用安装到桌面 | `[PWA] User accepted the install prompt` |
| 1.4 | 打开已安装应用 | 无地址栏，全屏显示 | 检查 `display-mode: standalone` CSS 生效 |

**验证点**:
- [ ] 安装图标出现
- [ ] 安装对话框正常弹出
- [ ] 安装后应用图标出现在桌面/启动器
- [ ] 已安装应用无浏览器 UI

---

### 2. Service Worker 注册

| 步骤 | 操作 | 预期结果 | 日志关键字 |
|------|------|----------|-----------|
| 2.1 | 打开 DevTools > Application > Service Workers | 看到 `service-worker.js` 已注册 | `[PWA] Registering Service Worker...` |
| 2.2 | 检查 Scope | 应该是 `/` | `[PWA] Service Worker registered: /` |
| 2.3 | 点击 "Update" | 检查更新 | `[PWA] Update check failed:` (如果无更新) |
| 2.4 | 检查 Cache Storage | 看到 `happy-static-v1` 缓存 | - |

**验证点**:
- [ ] Service Worker 状态为 "activated and is running"
- [ ] Scope 正确
- [ ] 缓存存储正常

---

### 3. 推送通知订阅

| 步骤 | 操作 | 预期结果 | 日志关键字 |
|------|------|----------|-----------|
| 3.1 | 登录账户 | 成功登录 | - |
| 3.2 | 进入设置页 > 通知设置 | 看到推送通知开关 | - |
| 3.3 | 开启推送通知 | 浏览器弹出权限请求 | `[PushSubscription] Notification permission:` |
| 3.4 | 允许权限 | 订阅成功 | `[PushSubscription] Created new push subscription` |
| 3.5 | 检查 DevTools > Application > Push Messaging | 看到订阅信息 | `[PushSubscription] Subscription synced to server` |
| 3.6 | 关闭推送通知 | 取消订阅 | `[PushSubscription] Unsubscribed from push notifications` |

**验证点**:
- [ ] 权限请求正常弹出
- [ ] 订阅/取消订阅状态正确显示
- [ ] Push Messaging 显示有效订阅

---

### 4. 推送通知接收

| 步骤 | 操作 | 预期结果 | 日志关键字 |
|------|------|----------|-----------|
| 4.1 | 在另一设备/CLI 触发审批请求 | 收到推送通知 | `[ServiceWorker] Push received` |
| 4.2 | 查看通知内容 | 显示请求标题和操作按钮 | `[ServiceWorker] Badge updated:` |
| 4.3 | 点击通知 | 跳转到对应页面 | `[NotificationRouter] Navigating to:` |
| 4.4 | 点击通知操作按钮 | 执行对应操作 | `[NotificationRouter] Handling action:` |
| 4.5 | 处理请求后 | 通知自动关闭 | `[PWA] Closing notifications for completed requests:` |

**验证点**:
- [ ] 通知正常显示
- [ ] 通知内容正确（标题、正文、图标）
- [ ] 点击跳转正确
- [ ] 操作按钮工作正常
- [ ] Badge 计数正确

---

### 5. 离线功能

| 步骤 | 操作 | 预期结果 | 日志关键字 |
|------|------|----------|-----------|
| 5.1 | 断开网络 (DevTools > Network > Offline) | 显示离线提示 | `[OfflineManager] Network state changed: offline` |
| 5.2 | 尝试页面导航 | 从缓存加载页面 | `[ServiceWorker] Network first failed, trying cache` |
| 5.3 | 尝试操作（如更新订阅偏好） | 操作入队待同步 | `[OfflineManager] Added pending sync item:` |
| 5.4 | 恢复网络 | 自动同步 | `[OfflineManager] Starting sync...` |
| 5.5 | 检查同步结果 | 同步成功 | `[OfflineManager] Sync completed: success` |

**验证点**:
- [ ] 离线状态正确检测
- [ ] 缓存页面可访问
- [ ] 操作正确入队
- [ ] 恢复网络后自动同步

---

### 6. 响应式布局（PWA Standalone 模式）

| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 6.1 | 在 iPhone 上安装 PWA（Safari > 分享 > 添加到主屏幕） | 安装成功 |
| 6.2 | 打开安装的应用 | 全屏显示，无地址栏 |
| 6.3 | 检查顶部安全区域 | 内容不被刘海遮挡 |
| 6.4 | 检查底部安全区域 | 内容不被 Home Indicator 遮挡 |
| 6.5 | 在 Android 上安装 PWA | 安装成功 |
| 6.6 | 检查状态栏颜色 | 与应用主题匹配 |

**验证点**:
- [ ] iOS Safe Area 正确处理
- [ ] Android 状态栏颜色正确
- [ ] 触摸目标足够大（≥44px）

---

### 7. 跨设备通知状态同步

| 步骤 | 操作 | 预期结果 | 日志关键字 |
|------|------|----------|-----------|
| 7.1 | 设备 A 收到推送通知 | 通知显示 | `[ServiceWorker] Push received` |
| 7.2 | 在设备 B 处理对应请求 | 请求被处理 | - |
| 7.3 | 检查设备 A 的通知 | 通知自动关闭 | `[PWA] Closing notifications for completed requests:` |
| 7.4 | 检查设备 A 的 Badge | Badge 计数减少 | `[PWA] Updating badge count:` |

**验证点**:
- [ ] 跨设备通知状态同步
- [ ] Badge 计数同步

---

## 调试技巧

### 浏览器控制台过滤

```javascript
// 只看 PWA 相关
filter: [PWA]

// 只看推送相关
filter: [PushSubscription]

// 只看 Service Worker
filter: [ServiceWorker]

// 只看离线管理
filter: [OfflineManager]

// 只看通知路由
filter: [NotificationRouter]
```

### 常见问题排查

| 问题 | 检查点 | 关键日志 |
|------|--------|----------|
| SW 注册失败 | HTTPS 或 localhost | `[PWA] Service Worker registration failed:` |
| 推送订阅失败 | 通知权限、VAPID 配置 | `[PushSubscription] Error subscribing to push:` |
| 通知不显示 | SW 状态、推送数据格式 | `[ServiceWorker] Failed to parse push data:` |
| 离线功能异常 | IndexedDB 支持 | `[OfflineManager] Failed to open database:` |
| 通知点击无响应 | 路由配置 | `[NotificationRouter] Router callback failed:` |
| Badge 不更新 | Badging API 支持 | `[ServiceWorker] Failed to update badge:` |

### DevTools 检查点

1. **Application > Service Workers**: SW 状态
2. **Application > Cache Storage**: 缓存内容
3. **Application > IndexedDB**: 离线数据
4. **Application > Push Messaging**: 推送订阅
5. **Application > Manifest**: PWA 配置
6. **Console**: 日志输出

---

## 测试环境要求

| 功能 | Chrome | Firefox | Safari | Edge |
|------|--------|---------|--------|------|
| Service Worker | ✅ | ✅ | ✅ | ✅ |
| Web Push | ✅ | ✅ | ✅ (macOS 13+) | ✅ |
| Badging API | ✅ | ❌ | ❌ | ✅ |
| PWA Install | ✅ | ❌ | ✅ (iOS) | ✅ |

**推荐测试浏览器**: Chrome (功能最全)

---

## 验收签字

| 功能模块 | 测试人 | 日期 | 结果 |
|----------|--------|------|------|
| PWA 安装 | | | ☐ Pass / ☐ Fail |
| Service Worker | | | ☐ Pass / ☐ Fail |
| 推送订阅 | | | ☐ Pass / ☐ Fail |
| 推送接收 | | | ☐ Pass / ☐ Fail |
| 离线功能 | | | ☐ Pass / ☐ Fail |
| 响应式布局 | | | ☐ Pass / ☐ Fail |
| 跨设备同步 | | | ☐ Pass / ☐ Fail |
