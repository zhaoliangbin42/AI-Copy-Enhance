---
description: CHANGELOG 编写规范 - 面向用户的变更日志格式
---

# 📝 CHANGELOG 编写规范

> CHANGELOG 面向用户，描述"做了什么"而非"怎么做"。

## ✅ 正确示例

```markdown
### Added
- 书签导入时的重复项检测与合并对话框

### Changed
- 大幅提升书签批量导入速度（10-50 倍）

### Fixed
- 修复书签导入时重复项的处理逻辑
```

## ❌ 错误示例

```markdown
### Added
- **StorageQueue**: Write queue using `chrome.storage.local` (`src/bookmarks/storage/StorageQueue.ts`)
- **Bulk Import**: `bulkSave()` method using single `chrome.storage.local.set()` call
```

## 规则

| 规则 | 说明 |
|:----|:----|
| 不写文件路径 | ❌ `src/bookmarks/storage/StorageQueue.ts` |
| 不写函数/方法名 | ❌ `bulkSave()`, `bulkRemove()` |
| 不写技术细节 | ❌ `chrome.storage.local.set()` |
| 不写单元测试/用例数量 | ❌ "新增 55 个单元测试用例" |
| 写用户可感知的变化 | ✅ "提升速度"、"新增功能"、"修复问题" |
