# Style Token 规范参考

> 本文档定义了项目中所有可用的设计 Token 及其正确用法。
> 所有样式必须使用语义层 Token，禁止直接使用原始层 Token。

---

## 🎯 Token 架构

```
┌─────────────────────────────────────────────────────────────┐
│  Tier 2: Semantic Tokens (语义层) - 必须使用               │
│  前缀: --aimd-                                              │
│  示例: --aimd-bg-primary, --aimd-text-secondary            │
├─────────────────────────────────────────────────────────────┤
│  Tier 1: Primitive Tokens (原始层) - 避免直接使用          │
│  前缀: --aimd-color-*                                       │
│  示例: --aimd-color-gray-100, --aimd-color-blue-600        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 背景色 Tokens

| Token | 用途 | 暗色模式值 |
|-------|------|-----------|
| `--aimd-bg-primary` | 主背景 | `#1E1E1E` |
| `--aimd-bg-secondary` | 次级背景 | `#2D2D2D` |
| `--aimd-bg-tertiary` | 第三级背景 | `#3D3D3D` |

### 交互状态

| Token | 用途 | 暗色模式值 |
|-------|------|-----------|
| `--aimd-interactive-hover` | 悬停背景 | `rgba(255, 255, 255, 0.10)` |
| `--aimd-interactive-selected` | 选中背景 | `rgba(59, 130, 246, 0.20)` |
| `--aimd-interactive-active` | 激活背景 | `rgba(255, 255, 255, 0.1)` |

---

## ✏️ 文字色 Tokens

| Token | 用途 | 替代的旧 Token |
|-------|------|---------------|
| `--aimd-text-primary` | 主文字 | `--aimd-color-gray-900` |
| `--aimd-text-secondary` | 次级文字 | `--aimd-color-gray-700` |
| `--aimd-text-tertiary` | 辅助文字 | `--aimd-color-gray-500` |
| `--aimd-text-on-primary` | 按钮内文字 | `#FFFFFF` |

---

## 🔲 边框 Tokens

| Token | 用途 |
|-------|------|
| `--aimd-border-subtle` | 细微边框 |
| `--aimd-border-default` | 默认边框 |
| `--aimd-border-strong` | 强调边框 |

---

## ⭕ 圆角 Tokens

> **重要**: 以下是唯一有效的圆角 Token！

| Token | 值 | 用途 |
|-------|-----|------|
| `--aimd-radius-sm` | 4px | 小元素 (badge, tag) |
| `--aimd-radius-md` | 6px | 按钮、输入框 |
| `--aimd-radius-lg` | 8px | 卡片、列表项 |
| `--aimd-radius-xl` | 12px | 弹窗、对话框 |
| `--aimd-radius-2xl` | 16px | 主面板 |

### ❌ 无效的 Token (请勿使用)

| 无效 Token | 应替换为 |
|-----------|---------|
| `--aimd-radius-small` | `--aimd-radius-lg` |
| `--aimd-radius-medium` | `--aimd-radius-xl` |
| `--aimd-radius-large` | `--aimd-radius-2xl` |

---

## 📏 间距 Tokens

| Token | 值 |
|-------|-----|
| `--aimd-space-1` | 4px |
| `--aimd-space-2` | 8px |
| `--aimd-space-3` | 12px |
| `--aimd-space-4` | 16px |
| `--aimd-space-6` | 24px |
| `--aimd-space-8` | 32px |
| `--aimd-space-10` | 40px |

---

## 🎯 按钮 Tokens

| Token | 用途 |
|-------|------|
| `--aimd-button-primary-bg` | 主按钮背景 |
| `--aimd-button-primary-text` | 主按钮文字 |
| `--aimd-button-primary-hover` | 主按钮悬停 |
| `--aimd-button-icon-bg` | 图标按钮背景 (transparent) |
| `--aimd-button-icon-text` | 图标按钮文字 |
| `--aimd-button-icon-hover` | 图标按钮悬停 |
| `--aimd-button-danger-bg` | 危险按钮背景 |
| `--aimd-button-danger-text` | 危险按钮文字 |

---

## 🔔 反馈 Tokens

| Token | 用途 |
|-------|------|
| `--aimd-feedback-info-bg` | 信息提示背景 |
| `--aimd-feedback-warning-bg` | 警告提示背景 |
| `--aimd-feedback-warning-text` | 警告提示文字 |
| `--aimd-feedback-danger-bg` | 危险提示背景 |
| `--aimd-feedback-danger-text` | 危险提示文字 |

---

## 🌓 主题感知

所有 `--aimd-*` 语义 Token 会根据主题自动切换值：
- 亮色模式: 在 `:host` 中定义亮色值
- 暗色模式: 在 `:host(.dark-mode)` 中定义暗色值

---

## 📁 源码位置

- Token 定义: `src/utils/design-tokens.ts` (Single Source of Truth)
- ~~Deprecated CSS: `src/styles/tokens/*.css`~~
- 主组件样式: `src/bookmarks/components/SimpleBookmarkPanel.ts`
- Mock 文件: `mocks/panel-dark.html`

---

## 🔄 Token 映射快速参考

```
旧 Token                    →  新 Token
────────────────────────────────────────────
--aimd-color-gray-50       →  --aimd-bg-secondary
--aimd-color-gray-100      →  --aimd-interactive-hover
--aimd-color-gray-500      →  --aimd-text-tertiary
--aimd-color-gray-700      →  --aimd-text-secondary
--aimd-color-gray-900      →  --aimd-text-primary
--aimd-color-blue-50       →  --aimd-interactive-selected
--aimd-radius-small        →  --aimd-radius-lg
--aimd-radius-medium       →  --aimd-radius-xl
--aimd-radius-large        →  --aimd-radius-2xl
```

---

## 🏗️ Z-Index Tokens (2026 Updated)

> **重大变更**: Z-Index 体系已重构，不再使用 21亿 (z-max) 的硬编码值。
> 采用 1-10000 的合理层级范围。

| Token | 值 | 用途 |
|-------|-----|------|
| `--aimd-z-base` | 1 | 基础内容层 (Toolbar) |
| `--aimd-z-dropdown` | 1000 | 下拉菜单 |
| `--aimd-z-sticky` | 1020 | 粘性元素 |
| `--aimd-z-fixed` | 1030 | 固定元素 |
| `--aimd-z-modal-backdrop` | 1040 | Modal 背景 |
| `--aimd-z-modal` | 1050 | Modal 内容 |
| `--aimd-z-popover` | 1060 | 弹出层 |
| `--aimd-z-tooltip` | 1070 | 提示层 |
| **`--aimd-z-panel`** | **9000** | 面板层 (Reader, Bookmarks) |
| **`--aimd-z-dialog`** | **9500** | 对话框层 (Alert, Confirm) |
| **`--aimd-z-notification`** | **9800** | 通知层 (预留) |
| **`--aimd-z-max`** | **10000** | 保留最高层 |
