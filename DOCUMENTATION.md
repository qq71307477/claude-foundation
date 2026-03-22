# Claude Foundation 项目文档

## 项目介绍

`claude-foundation` 是一个最小可安装的 npm 包，用于将 Claude Code foundation 快速初始化到您的项目目录中。它可以帮助您快速搭建 Claude Code 项目的基础设施和配置约定。

## 功能特性

- ✅ **快速初始化** - 自动创建 Claude Code 项目所需的基础文件和目录结构
- 🔧 **Hook 接线** - 自动配置项目级别的钩子设置
- 🗄️ **数据库约定** - 注入本地数据库使用约定和配置
- 🌐 **浏览器测试约定** - 注入浏览器测试使用约定
- 🧠 **记忆系统** - 初始化项目级记忆目录与向量索引
- ⚙️ **MCP 配置** - 预设 MCP (Model Context Protocol) 配置模板

## 安装

```bash
npm install -g claude-foundation
```

或者直接使用 npx：

```bash
npx claude-foundation init
```

## 使用方法

### 基本初始化

```bash
# 在项目目录中运行基本初始化
claude-foundation init
```

### 完整初始化（推荐用于新项目）

```bash
# 一次性完成所有初始化步骤
claude-foundation init --with-hooks --write-db-local-env
```

### 针对性功能

```bash
# 刷新 foundation 管理的 hook 命令路径
claude-foundation init --refresh-hooks

# 刷新数据库约定
claude-foundation init --refresh-db-convention

# 刷新浏览器测试约定
claude-foundation init --refresh-browser-convention

# 生成本地数据库环境配置文件
claude-foundation init --write-db-local-env

# 指定不同的数据库容器名
claude-foundation init --write-db-local-env --db-container-name my-mysql
```

## 项目结构

初始化后会在当前目录创建以下结构：

```
├── CLAUDE.md                    # Claude Code 项目配置文件
├── PROJECT_CONTEXT.md          # 项目上下文描述
├── DB_LOCAL.md                 # 本地数据库约定
├── BROWSER_TESTING.md          # 浏览器测试约定
├── .claude/
│   ├── rules/                  # 项目规则
│   ├── commands/               # 自定义命令
│   ├── skills/                 # 技能配置
│   ├── hooks/                  # 钩子配置
│   ├── mcp-configs/            # MCP 配置
│   └── memory/                 # 记忆系统目录
```

## 本地数据库约定

项目默认使用名为 `mysql80-local` 的 Docker 容器作为本地数据库。连接信息优先从项目 `.env` 读取，其次从 `~/.db-local.env` 读取。

初始化时可通过 `--write-db-local-env` 参数自动生成 `~/.db-local.env` 文件。

## 浏览器测试约定

项目默认使用 Playwright 进行浏览器/UI测试，优先调用本机已安装的 Chrome，如不可用则回退到 Playwright 自带的 Chromium。

## 记忆系统

项目内置了记忆系统，可在不同会话间保留重要信息：

- 通过 `/remember` 命令显式保存长期记忆
- 通过 `SessionStart` 自动预热记忆
- 通过 `UserPromptSubmit` hook 自动检索并注入相关记忆

## 常见用例

### 新项目初始化

```bash
cd your-new-project
claude-foundation init --with-hooks --write-db-local-env
claude
```

### 现有项目增强

```bash
cd your-existing-project
# 刷新所有约定和配置
claude-foundation init --with-hooks --refresh-hooks --refresh-db-convention --refresh-browser-convention --write-db-local-env
```

## 开发

克隆项目后，在包目录下可直接运行：

```bash
node ./bin/claude-foundation.js init
```

## 许可证

MIT License