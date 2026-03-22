# claude-foundation

`claude-foundation` 是一个最小可安装的 npm 包，用来把 Claude Code foundation 初始化到当前项目目录。

当前支持最小初始化、可选 hooks 接线、foundation hook 路径刷新、增强版本地数据库约定注入、浏览器测试约定注入、项目级记忆目录与向量索引初始化，以及可选的本机数据库凭据文件生成：

```bash
claude-foundation init
claude-foundation init --with-hooks
claude-foundation init --refresh-hooks
claude-foundation init --refresh-db-convention
claude-foundation init --refresh-browser-convention
claude-foundation init --write-db-local-env
claude-foundation init --with-hooks --refresh-hooks --refresh-db-convention --refresh-browser-convention --write-db-local-env
```

它会基于包内置的静态 assets，在当前目录写入：

- `CLAUDE.md`
- `PROJECT_CONTEXT.md`
- `DB_LOCAL.md`
- `BROWSER_TESTING.md`
- `.claude/rules/`
- `.claude/commands/`
- `.claude/skills/`
- `.claude/hooks/`
- `.claude/mcp-configs/`
- `.claude/memory/`
- `.claude/memory.lancedb/`

默认策略：

- 目标不存在时创建
- 目标已存在时跳过
- 不做全文件 merge
- 不自动覆盖用户现有内容

## 数据库约定注入

初始化时会自动带入一套本机数据库约定：

- 在 `CLAUDE.md` 中写入一个受管理的 `Local Database Convention` 区块
- 创建 `DB_LOCAL.md`
- 默认约定优先复用本机 Docker MySQL 容器 `mysql80-local`
- 默认建议连接信息优先读取项目 `.env`，其次读取 `~/.db-local.env`

### `--refresh-db-convention`

用于已有项目补齐或刷新这套数据库约定：

- 若 `DB_LOCAL.md` 不存在，则创建
- 若 `DB_LOCAL.md` 已存在，则用最新模板刷新
- 若 `CLAUDE.md` 中已有受管理数据库区块，则更新该区块
- 若 `CLAUDE.md` 中还没有该区块，则自动插入

### `--write-db-local-env`

用于从本机 Docker MySQL 容器读取当前连接信息，并在用户主目录创建私有配置文件：

- 默认目标文件：`~/.db-local.env`
- 默认容器名：`mysql80-local`
- 会从容器里读取：
  - root 密码
  - 映射端口
  - 默认数据库名
- 只在目标文件不存在时创建
- 若 `~/.db-local.env` 已存在，则不会覆盖

生成示例：

```env
MYSQL_CONTAINER=mysql80-local
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=testdb
```

### `--db-container-name <name>`

当你的本机容器名不是 `mysql80-local` 时，可以覆盖默认容器名：

```bash
claude-foundation init --write-db-local-env --db-container-name my-mysql
```

## 浏览器测试约定注入

初始化时会自动带入一套浏览器测试约定：

- 在 `CLAUDE.md` 中写入一个受管理的 `Browser Testing Convention` 区块
- 创建 `BROWSER_TESTING.md`
- 浏览器/UI/回归测试默认使用 Playwright
- 默认优先调用本机已安装的 Chrome
- 本机 Chrome 不可用时，再退回 Playwright 自带 Chromium

### `--refresh-browser-convention`

用于已有项目补齐或刷新这套浏览器约定：

- 若 `BROWSER_TESTING.md` 不存在，则创建
- 若 `BROWSER_TESTING.md` 已存在，则用最新模板刷新
- 若 `CLAUDE.md` 中已有受管理浏览器区块，则更新该区块
- 若 `CLAUDE.md` 中还没有该区块，则自动插入

## 记忆系统

初始化后会额外准备两层记忆存储：

- `.claude/memory/`：项目长期记忆的原始索引与文本元数据
- `.claude/memory.lancedb/`：向量数据库目录

当前推荐入口：

- 在 Claude 内通过 `/remember` 显式保存长期记忆
- 通过 `SessionStart` 做启动预热
- 通过 `UserPromptSubmit` hook 在需要时自动检索并注入相关记忆

当前架构分三层：

1. **明文记忆底座**
   - `.claude/memory/index.json` 始终保存原始文本与元数据
   - `SessionStart` 默认优先读取这层做 warmup
2. **工作流触发层**
   - `/remember` 负责显式写入
   - `UserPromptSubmit` 负责按条件读取
3. **向量增强层**
   - 仅当配置了 embedding 且本地粗筛命中时，才调用向量模型做增强检索

当前实现通过以下环境变量激活 embedding：

```bash
export MEMORY_EMBEDDING_PROVIDER=openai-compatible
export MEMORY_EMBEDDING_BASE_URL=https://your-proxy.example.com/v1
export MEMORY_EMBEDDING_API_KEY=xxx
export MEMORY_EMBEDDING_MODEL=your-embedding-model
```

说明：

- 只要没配置这四个值，记忆系统骨架仍然存在，但向量增强检索不会激活
- 未配置 embedding 时，系统会自动回退到"明文预热 + 本地关键词匹配"模式
- 当前仅实现了 `openai-compatible` provider
- `MEMORY_EMBEDDING_BASE_URL` 可指向你的反代地址；如果留空，则走默认 OpenAI 端点

`init` 现在会自动在 `claude-foundation` 包目录执行一次 `npm install` 来补齐记忆依赖，因此初始化完成后不需要再手动安装这些 memory 相关包。

## Hooks

`--with-hooks` 会额外安全合并项目级 `.claude/settings.json`：

- 只写项目级 settings
- 只 merge `hooks`
- 不覆盖现有其他 settings
- 不删除现有 hooks
- 默认接入 `SessionStart`、`SessionEnd`、`PreCompact`、`UserPromptSubmit`
- `UserPromptSubmit` 会通过 `memory-hook.js` 按条件触发检索，只在疑似规则/约定/偏好/历史决策类 prompt 上检索相关记忆，并通过 hook context 注入
- 默认会跳过短 prompt 与纯执行型 prompt，避免每轮会话都调用向量模型
- 若未导入 embedding 相关环境变量，hook 会自动降级为空上下文，不会阻断会话
- `cost-tracker.js` 保留为脚本资产，不默认自动接线

### `--refresh-hooks`

用于刷新 foundation 管理的 hook 命令路径：

- 刷新 `SessionStart`、`SessionEnd`、`PreCompact`
- 使用当前执行 `claude-foundation` 时的 node 绝对路径
- 只更新 foundation 管理的这三类 hook
- 不会覆盖无关自定义 hooks

## 本地开发

在包目录下直接运行：

```bash
node ./bin/claude-foundation.js init
```

查看帮助：

```bash
node ./bin/claude-foundation.js --help
```

## 使用流程

### 新项目一次性全做

```bash
cd your-project
claude-foundation init --with-hooks --write-db-local-env
claude
```

### 老项目刷新 foundation hook 路径

```bash
cd your-project
claude-foundation init --refresh-hooks
```

### 老项目补齐数据库与浏览器约定

```bash
cd your-project
claude-foundation init --refresh-db-convention --refresh-browser-convention
```

### 老项目一次性全补齐

```bash
cd your-project
claude-foundation init --with-hooks --refresh-hooks --refresh-db-convention --refresh-browser-convention --write-db-local-env
```

## 初始化后的建议

初始化后，优先补充：

- `CLAUDE.md`
- `PROJECT_CONTEXT.md`
- `DB_LOCAL.md`
- `BROWSER_TESTING.md`

如果你已经生成了 `~/.db-local.env`，而且项目已初始化完浏览器规则，新项目里可以开场告诉 Claude：

```txt
数据库相关任务默认直接使用 mysql80-local；优先读项目 .env，没有就读 ~/.db-local.env。浏览器相关任务默认使用 Playwright，优先调用本机 Chrome；若本机 Chrome 不可用，再退回 Playwright 自带 Chromium。
```
