# Claude Foundation 使用指南

## 什么是 Claude Foundation？

Claude Foundation 是一个专为 Claude Code 用户设计的工具包，旨在帮助开发者快速搭建 Claude Code 项目的基础设施。它通过自动化配置各种约定和设置，让开发者能够专注于业务逻辑而非环境配置。

## 快速开始

### 1. 安装

使用 npm 全局安装：

```bash
npm install -g claude-foundation
```

或者直接使用 npx（无需安装）：

```bash
npx claude-foundation init
```

### 2. 初始化项目

进入您的项目目录并运行初始化命令：

```bash
cd your-project-directory
claude-foundation init
```

### 3. 推荐的完整初始化

对于新项目，推荐一次性完成所有配置：

```bash
claude-foundation init --with-hooks --write-db-local-env
```

## 功能详解

### 文件和目录初始化

运行 `claude-foundation init` 会创建以下文件和目录：

- `CLAUDE.md` - 项目特定的 Claude 配置
- `PROJECT_CONTEXT.md` - 项目上下文描述
- `DB_LOCAL.md` - 本地数据库约定
- `BROWSER_TESTING.md` - 浏览器测试约定
- `.claude/` - Claude Code 专用配置目录
  - `rules/` - 项目规则
  - `commands/` - 自定义命令
  - `skills/` - 技能配置
  - `hooks/` - 钩子配置
  - `mcp-configs/` - MCP 配置
  - `memory/` - 记忆系统目录

### Hook 配置

使用 `--with-hooks` 参数会自动配置以下钩子：

- `SessionStart` - 会话开始时执行
- `SessionEnd` - 会话结束时执行
- `PreCompact` - 压缩前执行
- `UserPromptSubmit` - 提交用户提示时执行（用于记忆检索）

### 数据库约定

`--write-db-local-env` 参数会：

1. 检查本地 Docker 中的 MySQL 容器
2. 从中提取连接信息（主机、端口、密码等）
3. 在用户主目录创建 `~/.db-local.env` 文件

这个文件可以被 Claude 用于数据库相关的任务。

### 浏览器测试约定

项目会自动配置浏览器测试约定，推荐使用：

1. 优先使用本机安装的 Chrome
2. 如果本机 Chrome 不可用，则使用 Playwright 自带的 Chromium
3. 测试框架使用 Playwright

## 实际使用场景

### 场景一：新项目快速启动

```bash
mkdir my-awesome-project
cd my-awesome-project
claude-foundation init --with-hooks --write-db-local-env
claude
```

这样您的新项目就具备了完善的 Claude Code 配置！

### 场景二：老项目添加 Claude 支持

```bash
cd existing-project
claude-foundation init --with-hooks --refresh-db-convention --refresh-browser-convention
```

### 场景三：刷新现有配置

如果您更新了 Claude Foundation，可以刷新配置：

```bash
claude-foundation init --refresh-hooks --refresh-db-convention --refresh-browser-convention
```

## 与 Claude Code 集成

初始化后，您可以告诉 Claude 以下信息以获得更好的体验：

```
数据库相关任务默认直接使用 mysql80-local；优先读项目 .env，没有就读 ~/.db-local.env。浏览器相关任务默认使用 Playwright，优先调用本机 Chrome；若本机 Chrome 不可用，再退回 Playwright 自带 Chromium。
```

## 高级用法

### 自定义数据库容器名

如果您的本地 MySQL 容器不是默认的 `mysql80-local`，可以指定：

```bash
claude-foundation init --write-db-local-env --db-container-name my-custom-mysql
```

### 单独更新特定配置

```bash
# 只更新 Hook 配置
claude-foundation init --refresh-hooks

# 只更新数据库约定
claude-foundation init --refresh-db-convention

# 只更新浏览器约定
claude-foundation init --refresh-browser-convention
```

## 记忆系统详解

Claude Foundation 内置了记忆系统，可以在会话间保留重要信息：

1. **明文记忆底座**：在 `.claude/memory/index.json` 中保存原始文本与元数据
2. **工作流触发层**：通过 `/remember` 和 `UserPromptSubmit` hook 触发
3. **向量增强层**：可选择配置嵌入模型进行语义搜索

如果要启用向量增强功能，请设置以下环境变量：

```bash
export MEMORY_EMBEDDING_PROVIDER=openai-compatible
export MEMORY_EMBEDDING_BASE_URL=https://your-proxy.example.com/v1
export MEMORY_EMBEDDING_API_KEY=xxx
export MEMORY_EMBEDDING_MODEL=your-embedding-model
```

## 最佳实践

1. **新项目优先初始化**：在项目开始时就运行 `claude-foundation init`
2. **配置数据库连接**：使用 `--write-db-local-env` 自动配置数据库约定
3. **启用 Hooks**：使用 `--with-hooks` 启用高级功能
4. **定期更新**：随着 Claude Foundation 更新，适时使用 `--refresh-*` 参数更新配置
5. **个性化配置**：根据项目需要修改生成的 `.md` 文件中的具体说明

## 故障排除

### 常见问题

**Q: 初始化时出现权限错误**
A: 确保当前目录有写入权限，或者使用 `--dry-run` 查看将要创建的文件

**Q: 无法生成数据库配置文件**
A: 确保本地 Docker 正在运行且包含名为 `mysql80-local` 的容器（或使用 `--db-container-name` 指定其他名称）

**Q: Claude 没有识别到配置文件**
A: 确保在 Claude 会话中正确设置了工作目录，并且配置文件在正确位置

## 贡献

欢迎提交 Issue 和 Pull Request 来改进 Claude Foundation！

## 许可证

本项目使用 MIT 许可证，详见 `LICENSE` 文件。