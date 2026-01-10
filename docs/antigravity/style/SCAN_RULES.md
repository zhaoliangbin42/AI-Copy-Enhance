# 全局扫描规则 (Scan Rules)

> 本文档定义了样式修改前必须执行的全局扫描规则。
> **强制约束**: 未完成扫描不允许进入修改阶段。

---

## 🎯 扫描目的

1. **确认 Token 存在性** - 避免使用不存在的 Token
2. **发现重复定义** - 避免只改一处遗漏其他
3. **识别影响范围** - 评估修改的波及面
4. **同步 Mock 文件** - 确保测试环境一致

---

## 📋 必执行扫描清单

### 1. Token 存在性扫描

**目的**: 确认要使用的 Token 已定义

```bash
# 必须执行
grep -n "要使用的token名" src/utils/design-tokens.ts
```

**判定标准**:
- ✅ 有输出 → Token 存在，可以使用
- ❌ 无输出 → Token 不存在，**禁止使用**

---

### 2. 选择器定义扫描

**目的**: 找出所有定义同一选择器的位置

```bash
# 必须执行 - 搜索 TypeScript
grep -rn "\.选择器名" src/ --include="*.ts" | grep -v node_modules

# 必须执行 - 搜索 CSS
grep -rn "\.选择器名" src/ --include="*.css" | grep -v node_modules
```

**判定标准**:
- 如果有 **多处定义**，必须 **全部修改**
- 记录每处的文件路径和行号

---

### 3. Token 使用位置扫描

**目的**: 找出所有使用该 Token 的位置

```bash
# 必须执行
grep -rn "token名" src/ --include="*.ts" --include="*.css" | grep -v node_modules
```

**判定标准**:
- 记录所有使用位置
- 如果是 **废弃 Token**，所有位置都要替换

---

### 4. Mock 文件同步扫描

**目的**: 确认 Mock 文件是否需要同步

```bash
# 必须执行
grep -n "选择器或token" mocks/*.html
```

**判定标准**:
- 如果有匹配，修改源码后 **必须同步 Mock**

---

### 5. 重复定义计数

**目的**: 确认选择器或 Token 的定义次数

```bash
# 必须执行
grep -c "选择器或token" 目标文件
```

**判定标准**:
- 如果 > 1，存在重复定义，必须统一

---

## 📊 扫描结果模板

每次扫描后，必须记录结果：

```markdown
## 扫描结果
- 扫描时间: YYYY-MM-DD HH:MM
- 目标 Token/选择器: [名称]

### Token 存在性
- 结果: [存在/不存在]
- 定义位置: [文件:行号]

### 定义位置
| 文件 | 行号 | 定义内容 |
|------|------|---------|
| file1.ts | 100 | .selector { ... } |
| file2.ts | 200 | .selector { ... } |

### 使用位置
- 共 X 处使用
- 文件列表: [file1.ts, file2.ts, ...]

### Mock 同步
- 需要同步: [是/否]
- Mock 文件: [路径]

### 重复定义
- 重复次数: X
- 需要统一: [是/否]
```

---

## 🔴 扫描必须通过的条件

以下所有条件必须满足，否则禁止进入修改阶段：

| # | 条件 | 检查方法 |
|---|------|---------|
| 1 | Token 在 design-tokens.ts 中存在 | grep 搜索 |
| 2 | 所有重复定义位置已记录 | grep -c |
| 3 | Mock 同步需求已确认 | grep mocks/ |
| 4 | 影响范围已评估 | grep -rn |

---

## 🛑 扫描失败处理

### 情况 1: Token 不存在

**处理**: 
1. 停止修改流程
2. 确认正确的 Token 名称
3. 重新开始扫描

### 情况 2: 发现大量重复定义

**处理**:
1. 创建修改计划文档
2. 列出所有需要修改的位置
3. 逐一修改并验证

### 情况 3: Mock 文件不同步

**处理**:
1. 先完成源码修改
2. 同步 Mock 文件
3. 两者都验证

---

## 📁 相关命令速查

```bash
# Token 搜索
grep -rn "token" src/utils/design-tokens.ts

# 选择器搜索 (所有 TS 文件)
grep -rn "\.selector" src/ --include="*.ts"

# 特定文件中搜索
grep -n "pattern" specific-file.ts

# 计数
grep -c "pattern" file.ts

# Mock 搜索
grep -rn "pattern" mocks/

# 批量统计
grep -oh "pattern" src/**/*.ts | sort | uniq -c
```

---

## ⚠️ 常见扫描错误

| 错误 | 原因 | 解决 |
|------|------|------|
| 假设 Token 存在 | 未执行扫描 | 必须 grep 确认 |
| 只改一处定义 | 未发现重复 | 用 grep -c 计数 |
| Mock 不同步 | 未搜索 mocks/ | 必须搜索 mock |
| 遗漏文件 | 只搜索单个目录 | 用 -r 递归搜索 |
