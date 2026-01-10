---
description: 日志规范 - 统一的日志格式和级别
---

# 📝 日志规范

## 格式

```typescript
// 格式: [ProjectName][ModuleName] 消息
logger.debug('[AI-MarkDone][ReaderPanel] Rendering item 5');
logger.info('[AI-MarkDone][Toolbar] Copy button clicked');
logger.error('[AI-MarkDone][Parser] Failed to parse:', error);
```

## 日志级别

| 级别 | 用途 | 示例 |
|:----|:----|:----|
| `debug` | 开发调试信息 | 渲染步骤、状态变化 |
| `info` | 关键操作记录 | 用户操作、性能指标 |
| `warn` | 潜在问题 | 配置缺失、降级处理 |
| `error` | 异常错误 | 捕获的异常、失败操作 |

## 提交前检查

- [ ] 移除临时调试日志
- [ ] 确认日志级别正确
- [ ] 敏感信息不要打印
