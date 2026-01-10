---
description: 样式规范 - CSS/Design Token 使用规则
---

# 🎨 样式规范

> 样式修改请先执行 `/style` workflow。

## 核心规则

| 规则 | 说明 |
|:----|:----|
| 只用 `--aimd-*` Token | 禁止硬编码颜色/尺寸 |
| Shadow DOM 隔离 | UI 组件必须使用 Shadow DOM |
| 禁止 `!important` | 调整选择器优先级代替 |

## Design Token 示例

```css
/* ✅ 正确 */
.button {
    background: var(--aimd-primary);
    padding: var(--aimd-space-md);
    border-radius: var(--aimd-radius-sm);
}

/* ❌ 错误 */
.button {
    background: #3b82f6;
    padding: 16px;
    border-radius: 8px;
}
```

## 参考文档

- Token 定义: `src/styles/design-tokens.ts`
- 组件样式: `src/styles/components.css`
