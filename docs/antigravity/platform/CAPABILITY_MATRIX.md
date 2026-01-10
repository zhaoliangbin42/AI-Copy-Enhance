# Platform Capability Matrix

> **Version**: 2.3.0  
> **Last Updated**: 2026-01-07  
> **Purpose**: 各平台功能支持状态一览

---

## 功能支持矩阵

| 功能 | ChatGPT | Gemini | 备注 |
|:---|:---:|:---:|:---|
| **基础功能** | | | |
| Markdown 复制 | ✅ | ✅ | |
| LaTeX 公式复制 | ✅ | ✅ | KaTeX 渲染 |
| 代码块复制 | ✅ | ✅ | |
| 字数统计 | ✅ | ✅ | CJK 感知 |
| 工具栏注入 | ✅ | ✅ | |
| **阅读器功能** | | | |
| ReaderPanel 打开 | ✅ | ✅ | |
| 分页导航 | ✅ | ✅ | |
| 流式输出检测 | ✅ | ✅ | Copy Button 机制 |
| 用户提问提取 | ✅ | ✅ | Pagination Tooltip |
| **书签功能** | | | |
| 消息收藏 | ✅ | ✅ | |
| 书签管理面板 | ✅ | ✅ | |
| **消息发送** _(v2.4.0)_ | | | |
| 输入框同步 | 🔲 | 🔲 | 待实现 |
| 发送按钮模拟 | 🔲 | 🔲 | 待实现 |
| 回复完成检测 | 🔲 | 🔲 | 待实现 |

---

## 图例

| 符号 | 含义 |
|:---:|:---|
| ✅ | 已实现 |
| 🔲 | 计划中 |
| ⚠️ | 部分支持 |
| ❌ | 不支持 |

---

## 平台特有配置

### ChatGPT

| 项目 | 值 |
|:---|:---|
| URL 匹配 | `chatgpt.com`, `chat.openai.com` |
| 输入框 | ProseMirror (`#prompt-textarea`) |
| 发送按钮 | `.composer-submit-button-color` |
| 特殊处理 | Deep Research 模式 |

### Gemini

| 项目 | 值 |
|:---|:---|
| URL 匹配 | `gemini.google.com` |
| 输入框 | Quill (`rich-textarea .ql-editor`) |
| 发送按钮 | `.send-button.submit` |
| 特殊处理 | `model-thoughts` 噪音过滤 |

---

## 变更记录

| 版本 | 日期 | 变更内容 |
|:---|:---|:---|
| 2.3.0 | 2026-01-07 | 初始版本，列出已实现功能 |
