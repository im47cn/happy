# CLAUDE.md

一旦我所属的文件夹有所变化，请更新我。

## 概述

移动端专用可复用组件目录，包含仅在移动端使用的 UI 组件。

## 文件清单

| 文件名 | 地位 | 功能 |
|--------|------|------|
| `ApprovalDialog.tsx` | 核心 | 审批弹窗模态组件，提供批准/拒绝/修改参数功能 |

## ApprovalDialog 使用方式

```tsx
import { showApprovalDialog, ApprovalData } from '@/components/mobile/ApprovalDialog';

const data: ApprovalData = {
    sessionId: 'session-123',
    session: sessionObject,
    permissionId: 'perm-456',
    toolName: 'bash',
    toolArguments: { command: 'rm -rf /tmp/test' },
    createdAt: Date.now(),
    riskLevel: 'high',
};

// 显示弹窗
showApprovalDialog(data, (result) => {
    console.log('操作完成:', result);
});
```

## 依赖关系

- `@/modal` - Modal.show API
- `@/sync/ops` - sessionAllow/sessionDeny 函数
- `@/text` - 国际化翻译
- `react-native-unistyles` - 样式系统
