# 图标规范 (Icon Guidelines)

> 本文档定义了项目中图标的存储、命名和使用规范。
> **强制约束**: 违反本规范的代码将被拒绝。

---

## 📁 唯一存储位置

| 规则 | 说明 |
|------|------|
| **唯一路径** | `src/assets/icons.ts` |
| **格式** | SVG 字符串导出 (不是 .svg 文件) |
| **理由** | 便于 Tree-shaking、类型安全、集中管理 |

---

## ❌ 禁止的操作

| # | 禁止操作 | 原因 |
|---|---------|------|
| 1 | 创建新的 `.svg` 文件 | 分散管理困难 |
| 2 | 在组件中内联 SVG | 重复代码、难以维护 |
| 3 | 使用外部 CDN 图标 | 依赖外部服务、性能问题 |
| 4 | Base64 编码图标 | 不可读、不可编辑 |

---

## ✅ 正确的新增流程

### Step 1: 获取 SVG 图标

#### 通用图标 (推荐)

**官方图标库**: [Lucide Icons](https://lucide.dev/icons/) (ISC License)

```bash
# 联网搜索图标
# 访问 https://lucide.dev/icons/ 搜索需要的图标
# 复制 SVG 代码
```

**AI 获取方式**:
```
1. 搜索 Lucide Icons 网站获取 SVG
2. 或者使用 read_url_content 工具访问:
   https://lucide.dev/icons/[icon-name]
```

#### 平台专属图标

| 平台 | 来源 | 说明 |
|------|------|------|
| ChatGPT | OpenAI 官方品牌 | 使用官方 SVG |
| Gemini | Google 官方品牌 | 使用官方 SVG |

### Step 2: 优化 SVG

1. 移除不必要的属性 (xmlns, xml:space 等)
2. 确保 `viewBox` 属性存在
3. 使用 `currentColor` 以继承颜色

### Step 2: 添加到 icons.ts

```typescript
// 文件: src/assets/icons.ts

// 命名规范: camelCase + Icon 后缀
export const bookmarkIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
</svg>`;

export const folderIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
</svg>`;

// 新图标添加在这里...
export const newFeatureIcon = `<svg viewBox="0 0 24 24">...</svg>`;
```

### Step 3: 使用图标

```typescript
// 导入
import { bookmarkIcon, folderIcon } from '../assets/icons';

// 使用
element.innerHTML = bookmarkIcon;

// 或在模板中
const template = `
  <button class="icon-btn">
    ${bookmarkIcon}
    <span>Bookmark</span>
  </button>
`;
```

---

## 📏 命名规范

| 规范 | 示例 | 说明 |
|------|------|------|
| camelCase | `bookmarkIcon` | ✅ 正确 |
| 后缀 Icon | `folderIcon` | ✅ 正确 |
| 语义化 | `deleteIcon` | ✅ 描述功能 |
| kebab-case | `bookmark-icon` | ❌ 禁止 |
| 无后缀 | `bookmark` | ❌ 禁止 |
| 缩写 | `bkmkIcon` | ❌ 禁止 |

---

## 🎨 样式规范

### 默认样式

图标 SVG 应使用 `currentColor` 以继承父元素颜色：

```xml
<svg stroke="currentColor" fill="none">
```

### 尺寸控制

通过 CSS 控制尺寸，不在 SVG 中硬编码：

```css
.icon-container svg {
  width: 16px;
  height: 16px;
}
```

### 颜色控制

通过父元素 color 属性控制：

```css
.icon-btn {
  color: var(--aimd-text-secondary);
}

.icon-btn:hover {
  color: var(--aimd-text-primary);
}
```

---

## 📋 现有图标清单

查看所有可用图标：

```bash
grep "export const.*Icon" src/assets/icons.ts
```

---

## 🔍 检查 Workflow

新增图标前的检查：

```bash
# 1. 确认图标不存在
grep -n "相似名称" src/assets/icons.ts

# 2. 确认命名不冲突
grep -n "export const" src/assets/icons.ts | grep -i "关键词"
```

---

## 📝 新增图标模板

```typescript
/**
 * [图标描述]
 * 来源: [设计软件/图标库]
 * 用途: [使用场景]
 */
export const newFeatureIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="..."/>
</svg>`;
```
