# 样式修改踩坑经验总结

> 本文档记录了在 SimpleBookmarkPanel 样式重构过程中遇到的所有问题及其解决方案。
> 这些经验是未来样式修改必须参考的避坑指南。

---

## 🔴 P0: 致命问题 (导致视觉完全失效)

### 1. 使用不存在的 Token

**问题描述**:
```css
/* 错误代码 */
border-radius: var(--aimd-radius-small);  /* Token 不存在! */
```

**根本原因**: 
- `design-tokens.ts` 定义的是 `--aimd-radius-sm`, `--aimd-radius-lg` 等
- 代码中却使用了 `--aimd-radius-small`, `--aimd-radius-medium` 等不存在的名称
- CSS 变量不存在时，fallback 为空，导致样式无效

**解决方案**:
```
--aimd-radius-small  →  --aimd-radius-lg   (8px)
--aimd-radius-medium →  --aimd-radius-xl   (12px)
--aimd-radius-large  →  --aimd-radius-2xl  (16px)
```

**预防措施**:
- 修改前在 `design-tokens.ts` 中搜索确认 Token 存在
- 不要根据名称猜测，必须验证

---

### 2. CSS Reset 影响表单元素

**问题描述**:
```css
/* CSS Reset 中 */
input, button, select, textarea {
  appearance: none;
  border: none;
  background: none;
}
```

**影响**:
- Checkbox 变成不可见
- 搜索框边框和背景消失

**解决方案**:
```css
/* 排除需要保留外观的元素 */
input:not([type="checkbox"]):not([type="radio"]):not(.search-input),
button,
select,
textarea {
  /* reset rules */
}
```

**教训**: CSS Reset 必须精确定义作用范围

---

### 3. Hover 透明度过低

**问题描述**:
```css
--aimd-interactive-hover: rgba(255, 255, 255, 0.05);  /* 5% 不可见! */
```

**解决方案**:
```css
--aimd-interactive-hover: rgba(255, 255, 255, 0.10);  /* 10% 可见 */
```

**教训**: 暗色模式下，hover 效果需要更高的对比度

---

## 🟠 P1: 严重问题 (导致样式异常)

### 4. 同一选择器多处定义

**问题描述**:
```typescript
// Line 4532
.tree-item:hover {
  background: var(--aimd-interactive-hover);  // ✅ 正确
}

// Line 6060 - 后面覆盖前面!
.tree-item:hover {
  background: var(--aimd-color-gray-50);  // ❌ 错误
}
```

**解决方案**: 搜索并统一所有定义
```bash
grep -n "\.tree-item:hover" SimpleBookmarkPanel.ts
```

**教训**: 大文件 (6530 行) 中可能有重复定义，必须全面搜索

---

### 5. 容器背景色干扰

**问题描述**:
```css
.tree-view {
  background: var(--aimd-bg-primary);  /* 导致子元素背景溢出 */
}
```

**解决方案**:
```css
.tree-view {
  /* 不设置背景，继承父级 */
  padding: 8px 12px;  /* 添加 padding 防止溢出 */
}
```

---

### 6. 新旧 Token 混用

**问题描述**:
```css
/* 同一文件中 */
color: var(--aimd-text-primary);       /* 新版语义 Token ✅ */
color: var(--aimd-color-gray-500);     /* 旧版原始 Token ❌ */
```

**影响**: 暗色模式下，旧版 Token 值固定，导致样式不一致

**解决方案**:
```
旧版 Token              →  新版 Token
─────────────────────────────────────────
--aimd-color-gray-50   →  --aimd-bg-secondary
--aimd-color-gray-100  →  --aimd-interactive-hover
--aimd-color-gray-500  →  --aimd-text-tertiary
--aimd-color-gray-700  →  --aimd-text-secondary
--aimd-color-gray-900  →  --aimd-text-primary
```

---

## 🟡 P2: 中等问题 (导致样式不一致)

### 7. 硬编码 border-radius 值

**问题描述**:
```css
border-radius: 8px;  /* 硬编码 ❌ */
```

**解决方案**:
```css
border-radius: var(--aimd-radius-lg);  /* Token ✅ */
```

**映射表**:
```
4px  →  var(--aimd-radius-sm)
6px  →  var(--aimd-radius-md)
8px  →  var(--aimd-radius-lg)
12px →  var(--aimd-radius-xl)
16px →  var(--aimd-radius-2xl)
```

---

### 8. 修改错误的文件

**问题描述**:
```
用户反馈: toolbar tooltip 不显示
AI 修改: tooltip-helper.ts
结果: 没有效果

实际情况:
- tooltip-helper.ts 用于 deep-research-handler
- toolbar 使用的是 toolbar.css.ts 中的 .aicopy-button-feedback
```

**教训**: 
- 必须先搜索确认目标在哪个文件
- 不要根据文件名猜测

---

## 🔵 P3: 轻微问题 (不影响功能)

### 9. Mock 文件未同步

**问题描述**: 修改了 `SimpleBookmarkPanel.ts` 但忘记同步 `panel-dark.html`

**解决方案**: 修改源码后，搜索并同步 mock 文件
```bash
grep -n "修改的Token或选择器" mocks/panel-dark.html
```

---

## 📊 统计数据

本次重构中修复的问题数量:

| 问题类型 | 数量 |
|---------|------|
| 无效 Token 替换 | 24 处 |
| 硬编码值替换 | 22 处 |
| 旧版 Token 替换 | 13+ 处 |
| CSS Reset 修复 | 2 文件 |
| 重复定义统一 | 2 处 |

---

## 🔧 调试技巧

### 1. 检查 Token 是否生效
```bash
# 在浏览器 DevTools 中
# 查看 Computed Styles，如果值为空或 initial，说明 Token 不存在
```

### 2. 查找所有旧版 Token
```bash
grep -oh "\-\-aimd-color-[a-z0-9-]*" SimpleBookmarkPanel.ts | sort | uniq -c
```

### 3. 验证 Token 定义
```bash
grep "要使用的token" src/utils/design-tokens.ts
```

---

## 📝 经验法则

1. **修改前必须搜索** - 不要假设，必须验证
2. **一次改一处** - 避免批量替换导致意外问题
3. **Build 后再报告** - 不将未验证的修改报告为完成
4. **同步 Mock 文件** - 源码和 mock 必须保持一致
5. **使用语义 Token** - 永远不要直接使用原始层 Token
6. **检查重复定义** - 大文件中可能有多处定义同一选择器
7. **注意 CSS Reset** - 表单元素可能被重置影响
