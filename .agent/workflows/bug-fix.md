---
description: Bug 修复工作流 - 从复现到验证的完整SOP
---

# Bug 修复工作流

> 触发命令: `/bugfix`

---

## 🚨 Critical Rules (红线规则)

> [!CAUTION]
> 修复 Bug 时必须遵守的规则。

| 规则 | 原因 |
|:-----|:-----|
| **必须先复现** | 不能复现的 Bug 不能盲目修复 |
| **只修必要代码** | 不趁机重构其他代码 |
| **保持接口兼容** | 修复不应改变公共接口语义 |
| **添加防护代码** | 修复后增加边界检查和日志 |
| **禁止 `sed` 替换** | 使用精确的代码编辑工具 |

---

## Phase 1: 理解问题 (Understand)

### 1.1 收集信息

> 使用 `notify_user` 请求用户提供：

```
1. **问题描述**: 期望行为 vs 实际行为
2. **复现步骤**: 具体操作步骤
3. **相关日志**: 控制台输出或截图
4. **影响范围**: 影响哪些功能/页面
5. **首次出现**: 何时开始出现此问题
```

### 1.2 深度分析

> [!IMPORTANT]
> **思考预算**: 使用 `ultrathink` (~32k tokens) 进行根因分析。

```
请 ultrathink 分析这个问题：

1. **可能的根因**: 列出 3-5 个可能的原因
2. **相关模块**: 哪些模块可能涉及
3. **历史变更**: 最近是否有相关代码变更
4. **类似问题**: 是否遇到过类似的 Bug
```

---

## Phase 2: 定位问题 (Locate)

### 2.1 日志追踪

```bash
// turbo
# 搜索相关模块的代码
grep -rn "\[ModuleName\]" src/ --include="*.ts"

// turbo
# 查找错误处理点
grep -rn "catch\|error\|warn" 目标文件.ts
```

### 2.2 代码追踪

```bash
// turbo
# 搜索问题关键词
grep -rn "问题关键词" src/ --include="*.ts"

// turbo
# 查看调用链
grep -rn "函数名\|类名" src/ --include="*.ts"
```

### 2.3 确认根因

> [!WARNING]
> 修改代码前必须 100% 确认根本原因。表象修复会导致更多问题。

```
请 think deeply 确认根因：

1. **单点 vs 系统性**: 这是孤立问题还是设计缺陷？
2. **修复影响**: 修复这里会不会引入新问题？
3. **防御措施**: 需要添加哪些防御性代码？
```

---

## Phase 3: 修复问题 (Fix)

### 3.1 修复原则

| 原则 | 说明 |
|:-----|:-----|
| **最小侵入** | 只修改导致 Bug 的代码 |
| **添加日志** | 在关键路径添加调试日志 |
| **边界检查** | 添加空值检查和类型验证 |
| **优雅降级** | 确保失败时不会崩溃 |

### 3.2 修复模板

```typescript
// ❌ 修复前：问题代码
const result = riskyOperation();
doSomething(result.value);

// ✅ 修复后：添加防护
const result = riskyOperation();
if (!result || result.value === undefined) {
    logger.warn('[ModuleName] Unexpected result:', result);
    return fallbackValue; // 优雅降级
}
logger.debug('[ModuleName] Got result:', result.value);
doSomething(result.value);
```

### 3.3 日志增强

```typescript
// 在关键路径添加调试日志
logger.debug('[ModuleName] 开始处理:', { input });
logger.debug('[ModuleName] 中间状态:', { state });
logger.info('[ModuleName] 处理完成:', { output });
```

---

## Phase 4: 验证修复 (Verify)

### 4.1 编译检查

```bash
// turbo
npm run build
```

### 4.2 复现测试

> [!IMPORTANT]
> 必须让用户按原始步骤验证问题已解决。

```
使用 notify_user 请求用户验证：
1. 按原复现步骤操作
2. 确认问题已解决
3. 确认没有引入新问题
```

### 4.3 回归检查

```
请 think deeply 评估回归风险：

1. 修复是否影响其他功能？
2. 相关功能是否仍正常工作？
3. 是否需要额外的测试？
```

---

## Phase 5: 记录与预防 (Document)

### 5.1 更新 CHANGELOG

```markdown
## [Unreleased]

### Fixed
- **[模块名]**: 修复了 [问题描述]
```

### 5.2 经验记录 (可选)

> 如果是典型问题或踩坑，记录到经验文档：

| 条件 | 记录位置 |
|:-----|:---------|
| 样式相关踩坑 | `docs/antigravity/style/LESSONS_LEARNED.md` |
| 平台适配问题 | `ADAPTER_CONTRACT.md` 注意事项 |
| 架构性问题 | 创建 ADR 文档 |

### 5.3 预防措施

```
思考如何预防类似问题：
- 是否需要添加自动化测试？
- 是否需要更新文档？
- 是否需要添加更多日志？
```

---

## ✅ 完成检查清单

- [ ] **Phase 1**: 问题已完整理解，可以复现
- [ ] **Phase 2**: 根本原因已 100% 确认
- [ ] **Phase 3**: 修复代码完成，包含防护逻辑
- [ ] **Phase 4**: `npm run build` 成功
- [ ] **Phase 4**: 用户确认问题已解决
- [ ] **Phase 4**: 回归测试无新问题
- [ ] **Phase 5**: CHANGELOG 已更新
- [ ] **Phase 5**: 经验已记录 (如适用)
