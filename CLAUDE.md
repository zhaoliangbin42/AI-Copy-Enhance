# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **适用对象**: AI Agent (Claude/Gemini/GPT) 及人类开发者
> **版本**: 4.0.0

---

## 📌 项��概述

| 属性 | 值 |
|:-----|:---|
| **项目名称** | AI-MarkDone |
| **类型** | Chrome 浏览器扩展 (Manifest V3) |
| **目标平台** | ChatGPT, Gemini |
| **技术栈** | TypeScript, Vite, Shadow DOM |
| **核心功能** | 公式复制、Markdown 复制、实时预览、字数统计、书签管理 |

---

## 💻 开发命令

```bash
# Install dependencies
npm install

# Development (with HMR)
npm run dev
# Note: After build, manually reload extension in chrome://extensions/

# Production build
npm run build
# Note: This compiles TypeScript, builds with Vite, and copies assets to dist/

# Type checking
npm run type-check

# Run tests
npm run test

# Run tests with UI
npm run test:ui
```

**Loading the extension for development:**

1. Run `npm run build`
2. Open `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `dist/` folder

---

## 📋 规则文件

> [!IMPORTANT]
> 开发前必须阅读对应规则文件。

| 规则 | 文件 | 说明 |
|:----|:----|:----|
| 🚨 红线规则 | [critical-rules.md](.agent/rules/critical-rules.md) | 绝对禁止违反 |
| 📝 CHANGELOG | [changelog.md](.agent/rules/changelog.md) | 变更日志格式 (🚫 严禁敏感信息) |
| 🎨 样式规范 | [style-guide.md](.agent/rules/style-guide.md) | CSS/Token 规则 |
| 📋 日志规范 | [logging.md](.agent/rules/logging.md) | 日志格式与级别 |

---

## 🔧 工作流

> 输入斜杠命令触发对应工作流。

| 命令 | 工作流 | 用途 |
|:-----|:-------|:-----|
| `/develop` | [development.md](.agent/workflows/development.md) | 新功能开发 |
| `/bugfix` | [bug-fix.md](.agent/workflows/bug-fix.md) | Bug 修复 |
| `/review` | [code-review.md](.agent/workflows/code-review.md) | 代码审查 |
| `/style` | [style-modification.md](.agent/workflows/style-modification.md) | 样式修改 |
| `/release` | [release-preparation.md](.agent/workflows/release-preparation.md) | 发版准备 |

---

## 🧠 Think Keywords

| 关键词 | 思考预算 | 适用场景 |
|:-------|:---------|:---------|
| `think` | ~4k tokens | 简单代码分析 |
| `think deeply` | ~10k tokens | 代码审查、Bug 分析 |
| `ultrathink` | ~32k tokens | 架构决策、复杂重构 |

---

## 🏗️ 架构概览

### 目录结构

```text
src/
├── content/              # Content Script 主入口
│   ├── adapters/         # 平台适配器 (ChatGPT/Gemini)
│   ├── components/       # Shadow DOM UI 组件
│   ├── features/         # 功能模块
│   ├── injectors/        # 工具栏注入逻辑
│   ├── observers/        # Mutation observers
│   ├── parsers/          # Markdown 解析器
│   └── utils/            # Content script 工具函数
├── bookmarks/            # 书签功能模块
├── renderer/             # Markdown 渲染器
├── settings/             # 设置管理
├── styles/               # 样式与 Design Token
├── utils/                # 全局工具函数
└── background/           # Background service worker
```

### 核心架构模式

#### 1. 适配器模式（多平台支持）

- **Base Adapter**: `src/content/adapters/base.ts` 定义 `SiteAdapter` 抽象类
- **Platform Implementations**: `ChatGPTAdapter`, `GeminiAdapter` 继承基类
- **Registry**: `src/content/adapters/registry.ts` 管理适配器选择

**新增平台步骤：**

1. 创建 `src/content/adapters/[platform].ts`
2. 继承 `SiteAdapter` 并实现所有抽象方法
3. 在 `AdapterRegistry` 构造函数中注册
4. 更新 `src/background/service-worker.ts` 中的 `SUPPORTED_HOSTS`

#### 2. Shadow DOM 隔离

所有 UI 组件使用 Shadow DOM 防止与宿主页面 CSS 冲突：

```typescript
// 组件结构（参见 src/content/components/toolbar.ts）
class Toolbar {
    private shadowRoot: ShadowRoot;

    constructor() {
        this.shadowRoot = this.container.attachShadow({ mode: 'open' });
        this.injectStyles();
        this.injectHTML();
    }
}
```

**重要：**

- 样式定义在 `src/styles/*.css.ts` 中（模板字符串）
- 永远不要使用全局 CSS - 无法到达 Shadow DOM 组件
- 使用 design tokens (`var(--aimd-*)`) 实现一致的主题

#### 3. 解析器管道架构

`MarkdownParser` 协调多个专门的解析器按顺序处理：

```text
HTML Input
    ↓
CodeExtractor (保护 <pre><code> 块)
    ↓
TableParser (转换 HTML 表格为 Markdown)
    ↓
Turndown (HTML → Markdown 带自定义规则)
    ↓
MathExtractor (从占位符恢复 LaTeX)
    ↓
Post-processor (清理和规范化)
    ↓
Markdown Output
```

**关键解析器：**

- `src/content/parsers/code-extractor.ts` - 提取带语言检测的代码块
- `src/content/parsers/table-parser.ts` - 转换 HTML 表格为管道语法
- `src/content/parsers/math-extractor.ts` - 处理 LaTeX 公式（行内 `$...$` 和块 `$$...$$`）
- `src/content/parsers/word-counter.ts` - 统计 CJK 与拉丁字符

**占位符模式：**

代码块和数学公式在 Turndown 转换期间被占位符替换，然后恢复原始内容。这防止 Turndown 破坏复杂内容。

#### 4. MutationObserver 模式

扩展使用防抖的 MutationObserver 检测新消息：

- `src/content/observers/mutation-observer.ts` 监听 DOM 变化
- 使用 `WeakSet` 跟踪已处理的消息（防止重复）
- 200ms 防抖避免过度处理
- 正确处理 SPA 导航

#### 5. 事件驱动架构

扩展使用事件总线进行组件通信：

```typescript
// src/content/utils/EventBus.ts
eventBus.emit('message:new', { count: allMessages.length });
eventBus.emit('message:complete', { count: allMessages.length });
```

这允许解耦的组件对状态变化做出反应，而无需紧耦合。

---

## 📁 参考文档

| 文档 | 用途 |
|:----|:----|
| [platform-adaptation.md](.agent/workflows/platform-adaptation.md) | **Platform Integration Manual** (SOP & Contract) |
| [CAPABILITY_MATRIX.md](docs/antigravity/platform/CAPABILITY_MATRIX.md) | 平台功能支持矩阵 |

### 其他关键文档

- **platform-adaptation.md** - 平台适配手册 (SOP & Contract)
- **CAPABILITY_MATRIX.md** - 平台功能支持矩阵
- **GEMINI.md** - AI agent 开发标准
- **.github/copilot-instructions.md** - 详细架构指南

### 样式文档

- **Token Reference**: `docs/antigravity/style/TOKEN_REFERENCE.md`
- **Style Guide**: `.agent/rules/style-guide.md`
- **Icon Guidelines**: `docs/antigravity/style/ICON_GUIDELINES.md`

---

## 🔍 关键实现细节

### 数学公式处理

数学公式是最复杂的功能：

1. **KaTeX 检测**: ChatGPT/Gemini 使用 KaTeX 渲染 LaTeX
2. **LaTeX 提取**: 从 `<annotation encoding="application/x-tex">` 标签
3. **点击复制**: `MathClickHandler` 为 `.katex` 元素添加点击监听器
4. **Fallback**: `MathExtractor` 处理失败的 `\[...\]`, `\(...\)` 模式

**输出格式：**

- 行内: `$formula$`
- 块: `$$\nformula\n$$` (Typora 兼容)

### Deep Research 消息

Gemini 的 "Deep Research" 功能产生嵌套的 `<article>` 结构：

- 通过 `isDeepResearch()` 检测嵌套文章
- `parseDeepResearch()` 中的自定义递归解析器
- 修复 Deep Research 输出中出现的数学公式问题

### 主题管理

扩展自动适应宿主网站的主题：

- `ThemeManager` 检测宿主页面主题变化
- 实时更新 Shadow DOM design tokens
- 所有组件通过 `setTheme(isDark)` 接收主题更新

### 流式检测

扩展必须等待流式完成才能显示工具栏：

- `StreamingDetector` 监视复制按钮的出现
- 工具栏从 "pending" 状态开始（隐藏或禁用）
- 当复制按钮出现时激活（流式完成）

---

## 📝 编码约定

### TypeScript 规则

- **启用严格模式** - 强制执行所有类型检查
- **公共方法的显式返回类型**
- **无未使用的局部变量/参数** - 由 tsconfig 强制执行
- 使用 `logger.debug()`, `logger.info()`, `logger.error()` 记录日志

### 防御性编程

```typescript
// 始终检查 null/undefined
const element = document.querySelector(selector);
if (!element) {
    logger.warn('[ModuleName] Element not found:', selector);
    return; // 优雅降级
}

// 修改前克隆 DOM
const clone = element.cloneNode(true);
```

### 样式规则

- **仅使用 design tokens**: `var(--aimd-primary)`, `var(--aimd-space-md)` 等
- **无硬编码颜色或尺寸** - 参见 `src/styles/design-tokens.ts`
- **禁止使用 `!important`** - 调整选择器特异性代替
- **SVG 图标**: 使用内联 SVG 带 stroke（不是 fill）保持一致性

### 日志

在 `src/content/index.ts` 构造函数中设置日志级别：

```typescript
logger.setLevel(LogLevel.DEBUG); // 开发中使用 DEBUG，生产中使用 INFO
```

日志格式：

```typescript
logger.debug('[ModuleName] Description', { key: value });
logger.info('[ModuleName] Major event');
logger.error('[ModuleName] Error:', error);
```

---

## 🧪 测试

项目包含用于测试的模拟 HTML 文件：

- `ChatGPT-Success.html` - 正常 KaTeX 渲染
- `ChatGPT-Fail.html` - 渲染失败（原始 LaTeX）
- `ChatGPT-DeepResearch.html` - 嵌套文章结构

这些文件展示了解析器必须处理的不同 DOM 结构。

---

## 🎯 常见任务

### 添加新平台

1. 在 `src/content/adapters/[platform].ts` 中创建扩展 `SiteAdapter`
2. 实现所有抽象方法（特别是选择器）
3. 在 `AdapterRegistry` 构造函数中注册
4. 更新 background 脚本中的 `SUPPORTED_HOSTS`
5. 向 popup HTML 添加平台链接
6. 更新 `docs/antigravity/platform/CAPABILITY_MATRIX.md`
7. 向 `mocks/` 目录添加模拟 HTML

### 修改 UI 组件

1. 在 `src/content/components/*.ts` 中更新组件（Shadow DOM 创建）
2. 在 `src/styles/*.css.ts` 中更新样式（CSS-in-JS）
3. 在实际的 ChatGPT/Gemini 页面上测试以验证隔离

### 添加新解析器

1. 在 `src/content/parsers/` 中创建
2. 集成到 `MarkdownParser.parse()` 管道中（顺序很重要！）
3. 如果与 Turndown 冲突，使用占位符模式
4. 使用模拟 HTML 文件添加测试

---

## 🚨 关键规则

来自 `.agent/rules/critical-rules.md`：

| 规则 | 原因 |
|:-----|:-------|
| **禁止 `sed` 批量替换** | 不可控，破坏代码结构 |
| **禁止 `git checkout` 回滚** | 用户明确禁止 |
| **禁止添加 `!important`** | 破坏 CSS 层叠，难以维护 |
| **禁止假设文件/函数存在** | 必须 `grep` 先确认位置 |
| **禁止硬编码颜色/尺寸** | 必须使用 `--aimd-*` design tokens |
| **禁止未 build 就报告完成** | 必须 `npm run build` 验证 |

---

## ✅ 提交前检查

- [ ] `npm run build` 成功
- [ ] 接口变更已更新 `ADAPTER_CONTRACT.md`
- [ ] `CHANGELOG.md` 已更新（见 [changelog.md](.agent/rules/changelog.md)） **(Must be in English / 必须使用英文)**

---

## 🔧 构建配置

### Vite 设置

- **Rollup inputs**: `content.ts` 和 `background.ts` 分别构建
- **无 @crxjs 插件** - postbuild 脚本中手动复制 manifest
- **Output format**: ES modules
- **Source maps**: 生产环境禁用

### TypeScript 配置

- **Target**: ES2020
- **Module resolution**: Bundler mode
- **Path alias**: `@/*` 映射到 `src/*`

---

## 🎯 平台特定说明

### ChatGPT

- 消息容器: `article[data-turn]`
- 用户消息: `[data-message-author-role="user"]`
- 助手消息: `[data-message-author-role="assistant"]`
- 输入: `#prompt-textarea`

### Gemini

- 消息容器: `model-response`
- 用户提示: `[data-test-id="user-query"]`
- 输入: `rich-textarea .ql-editor`
- Deep Research: 嵌套的 `<article>` 标签
