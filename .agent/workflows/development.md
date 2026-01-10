---
description: 新功能开发工作流 - 从需求到验证的完整SOP
---

# 新功能开发工作流

> 触发命令: `/develop`

---

## 🚨 Critical Rules (红线规则)

> [!CAUTION]
> 以下规则必须严格遵守，违反将导致代码质量问题。

| 规则 | 原因 |
|:-----|:-----|
| **禁止 `sed` 批量替换** | 不可控，易破坏代码 |
| **禁止 `git checkout` 回滚** | 用户明确禁止 |
| **禁止添加 `!important`** | 破坏 CSS 层叠机制 |
| **禁止硬编码颜色/尺寸** | 必须使用 `--aimd-*` Token |
| **禁止未搜索就修改** | 必须 `grep` 确认所有调用点 |
| **禁止假设文件存在** | 必须先搜索确认 |

---

## Phase 1: 深度分析 (Think Deeply)

> [!IMPORTANT]
> **思考预算**: 使用 `ultrathink` 分配 ~32k tokens 进行深度分析。
> 这是最关键的阶段，决定了后续开发的质量。

### 1.1 需求理解

```
请 ultrathink 分析以下需求：

1. **用户目标**: 用户期望的最终结果是什么？
2. **边界条件**: 有哪些异常情况和边界 case？
3. **影响评估**: 是否影响现有功能？
4. **平台兼容**: ChatGPT 和 Gemini 都需要支持吗？
```

### 1.2 架构影响评估

```bash
// turbo
# 搜索相关代码
grep -rn "相关关键词" src/ --include="*.ts"

// turbo
# 检查是否有可复用的实现
grep -rn "类似功能" src/utils/ src/components/

// turbo
# 检查平台适配器
grep -rn "相关选择器" src/content/adapters/
```

### 1.3 依赖矩阵

| 检查项 | 位置 | 命令 |
|:-------|:-----|:-----|
| 现有接口 | `adapters/base.ts` | `grep -rn "abstract" src/content/adapters/base.ts` |
| 平台兼容 | `ADAPTER_CONTRACT.md` | 阅读文档 |
| 样式 Token | `TOKEN_REFERENCE.md` | 阅读文档 |
| 共享工具 | `src/utils/` | `ls -la src/utils/` |

---

## Phase 2: 制定计划 (Plan)

> [!TIP]
> **先计划，后执行**。创建 `implementation_plan.md` 获取用户确认。
> 这是 Claude Code 最佳实践的核心原则。

### 2.1 计划模板

```markdown
# 实现计划: [功能名称]

## 变更范围

| 文件 | 变更类型 | 描述 |
|:-----|:---------|:-----|
| `path/to/file1.ts` | MODIFY | 变更描述 |
| `path/to/file2.ts` | NEW | 新增描述 |

## 依赖的接口
- `SiteAdapter.getXxxSelector()` — 用途描述

## 风险评估

| 风险等级 | 描述 | 缓解措施 |
|:---------|:-----|:---------|
| 🟢 低 | ... | ... |
| 🟡 中 | ... | ... |

## 验证方案
1. `npm run build` 编译验证
2. 手动测试步骤...
```

### 2.2 获取用户确认

```
使用 notify_user 工具：
- PathsToReview: [implementation_plan.md 路径]
- BlockedOnUser: true
- ShouldAutoProceed: false (除非计划非常简单)
```

---

## Phase 3: 执行开发 (Act)

### 3.1 开发原则

| 原则 | 说明 | 来源 |
|:-----|:-----|:-----|
| **最小变更** | 只修改必要的代码 | GEMINI.md |
| **原子操作** | 每个逻辑单元单独处理 | claude-flow |
| **搜索优先** | 修改前确认所有调用点 | GEMINI.md |
| **并行执行** | 无依赖的工具调用并行执行 | claude-flow |

### 3.2 代码规范

```typescript
// ✅ 日志规范 (必须包含模块名)
logger.debug('[ModuleName] 操作描述', { key: value });
logger.info('[ModuleName] 重要事件');
logger.error('[ModuleName] 错误:', error);

// ✅ 防御性编程
const element = document.querySelector(selector);
if (!element) {
    logger.warn('[ModuleName] Element not found:', selector);
    return; // 优雅降级
}

// ✅ 错误处理
try {
    await riskyOperation();
} catch (error) {
    logger.error('[ModuleName] 操作失败:', error);
    // 优雅降级或向上抛出
}
```

### 3.3 安全规则

> [!WARNING]
> 来自 davila7/claude-code-templates 的安全最佳实践

| 规则 | 说明 |
|:-----|:-----|
| **禁止硬编码敏感信息** | API Key、密码等必须通过环境变量 |
| **使用相对路径** | 避免硬编码绝对路径 |
| **路径拼接用 `path.join()`** | 保证跨平台兼容 |

---

## Phase 4: 验证 (Verify)

### 4.1 编译验证 (必须通过)

```bash
// turbo
npm run build
```

### 4.2 测试验证 (如适用)

```bash
// turbo
npm run test
```

### 4.3 自我审查 (Self-Review)

> [!TIP]
> **思考预算**: 使用 `think deeply` (~10k tokens) 进行代码审查。

```
请 think deeply 审查刚才的代码变更：

1. **完整性**: 是否有遗漏的边界情况？
2. **健壮性**: 是否正确处理了所有错误？
3. **可调试**: 日志是否足够定位问题？
4. **一致性**: 是否遵循项目现有模式？
5. **文档**: 是否需要更新相关文档？
```

---

## Phase 5: 文档更新 (Reflect)

### 5.1 文档更新矩阵

| 条件 | 需更新的文档 |
|:-----|:-------------|
| 新增/修改公共接口 | `docs/antigravity/platform/ADAPTER_CONTRACT.md` |
| 新增平台功能 | `docs/antigravity/platform/CAPABILITY_MATRIX.md` |
| 新增 Adapter 工具类 | `ADAPTER_CONTRACT.md` 共享工具类章节 |
| 发现踩坑经验 | `docs/antigravity/style/LESSONS_LEARNED.md` |

### 5.2 更新 CHANGELOG

```markdown
## [Unreleased]

### Added
- **[功能名]**: 功能描述
```

---

## ✅ 完成检查清单

- [ ] **Phase 1**: `ultrathink` 深度分析完成
- [ ] **Phase 2**: 计划已获用户确认
- [ ] **Phase 3**: 代码修改完成，遵循所有规范
- [ ] **Phase 4**: `npm run build` 成功
- [ ] **Phase 4**: 自我审查完成
- [ ] **Phase 5**: 相关文档已更新
- [ ] **Phase 5**: CHANGELOG 已更新
