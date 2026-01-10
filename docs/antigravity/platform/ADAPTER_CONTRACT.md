# Platform Adapter Interface Contract

> **Version**: 2.3.0  
> **Last Updated**: 2026-01-07  
> **Purpose**: 适配新平台时的**唯一参考文档**

---

## 快速开始

新增平台适配器只需 3 步：

1. **创建 Adapter** — `src/content/adapters/[platform].ts`
2. **实现接口** — 继承 `SiteAdapter`，实现所有 `abstract` 方法
3. **注册 Adapter** — 在 `src/content/adapters/index.ts` 中注册

---

## 核心接口

> [!IMPORTANT]
> 所有 `abstract` 方法必须实现，否则 TypeScript 编译失败。

### 基类定义

| 文件 | 路径 |
|:---|:---|
| **SiteAdapter** | [base.ts](file:///Users/benko/Documents/4-工作/7-OpenSource/AI-MarkDone/src/content/adapters/base.ts) |

### 必须实现的方法

| 方法 | 返回类型 | 说明 |
|:---|:---|:---|
| `matches(url)` | `boolean` | URL 匹配检测 |
| `getMessageSelector()` | `string` | AI 消息容器选择器 |
| `getMessageContentSelector()` | `string` | 消息内容区域选择器 |
| `getActionBarSelector()` | `string` | 工具栏注入位置选择器 |
| `getCopyButtonSelector()` | `string` | 复制按钮选择器（流式完成检测） |
| `extractMessageHTML(element)` | `string` | 提取消息 HTML |
| `isStreamingMessage(element)` | `boolean` | 判断是否正在流式输出 |
| `getMessageId(element)` | `string \| null` | 获取消息唯一 ID |
| `getObserverContainer()` | `HTMLElement \| null` | MutationObserver 监听容器 |
| `getUserPrompts()` | `string[]` | 获取所有用户提问 |
| `extractUserPrompt(element)` | `string \| null` | 提取对应的用户提问 |
| `getIcon()` | `string` | 平台图标 SVG |

### 可选覆盖的方法

| 方法 | 默认行为 | 说明 |
|:---|:---|:---|
| `isNoiseNode(node, context?)` | `return false` | 平台特定噪音过滤 |

---

## 共享工具类

> [!TIP]
> 以下工具类使用 `SiteAdapter` 的方法实现跨平台功能。

| 类名 | 文件 | 依赖的 Adapter 方法 | 用途 |
|:---|:---|:---|:---|
| `StreamingDetector` | [streaming-detector.ts](file:///Users/benko/Documents/4-工作/7-OpenSource/AI-MarkDone/src/content/adapters/streaming-detector.ts) | `getCopyButtonSelector()` | 检测流式输出完成 |

### StreamingDetector 使用方式

```typescript
import { StreamingDetector } from '../adapters/streaming-detector';

// 开始监控
const detector = new StreamingDetector(adapter);
const stopWatching = detector.startWatching(() => {
    console.log('Streaming complete!');
});

// 清理
stopWatching();
```


## 待实现接口 (v2.4.0 - Message Sending)

> [!NOTE]
> 以下接口将在「阅读器消息发送功能」中新增。

| 方法 | 返回类型 | 说明 | PRD 参考 |
|:---|:---|:---|:---|
| `getInputSelector()` | `string` | 输入框选择器 | [PRD §4](file:///Users/benko/.gemini/antigravity/brain/6b3c992d-c909-43dc-b2c1-c169ee5360e1/PRD-Reader-Message-Sending.md) |
| `getSendButtonSelector()` | `string` | 发送按钮选择器 | [PRD §4](file:///Users/benko/.gemini/antigravity/brain/6b3c992d-c909-43dc-b2c1-c169ee5360e1/PRD-Reader-Message-Sending.md) |
| `getInputElement()` | `HTMLElement \| null` | 获取输入框元素 | — |
| `getSendButton()` | `HTMLElement \| null` | 获取发送按钮元素 | — |

---

## 现有实现参考

| 平台 | 文件 | 关键选择器 |
|:---|:---|:---|
| **ChatGPT** | [chatgpt.ts](file:///Users/benko/Documents/4-工作/7-OpenSource/AI-MarkDone/src/content/adapters/chatgpt.ts) | `#prompt-textarea`, `article[data-turn]` |
| **Gemini** | [gemini.ts](file:///Users/benko/Documents/4-工作/7-OpenSource/AI-MarkDone/src/content/adapters/gemini.ts) | `model-response`, `rich-textarea .ql-editor` |

---

## 新平台检查清单

- [ ] 实现所有 `abstract` 方法
- [ ] 在 `adapterRegistry` 中注册
- [ ] 更新 `src/background/service-worker.ts` 中的 `SUPPORTED_HOSTS` 列表
- [ ] 更新 `src/popup/popup.html` 添加新平台链接
- [ ] 更新 [CAPABILITY_MATRIX.md](file:///Users/benko/Documents/4-工作/7-OpenSource/AI-MarkDone/docs/antigravity/platform/CAPABILITY_MATRIX.md)
- [ ] 添加 Mock HTML 到 `mocks/` 目录
- [ ] 运行 `npm run build` 验证编译

---

## 变更记录

| 版本 | 日期 | 变更内容 |
|:---|:---|:---|
| 2.3.0 | 2026-01-07 | 初始版本，从现有代码提取接口定义 |
| 2.4.0 | (计划) | 新增消息发送相关接口 |
