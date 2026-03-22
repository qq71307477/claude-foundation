# claude-foundation

A minimal npm package to initialize Claude Code foundation in your project directory.

[中文文档](./DOCUMENTATION.md) | [使用指南](./GUIDE.md)

## Features

- ✅ Quick initialization of Claude Code project structure
- 🔧 Hook wiring for enhanced functionality  
- 🗄️ Local database convention injection
- 🌐 Browser testing convention injection
- 🧠 Memory system initialization
- ⚙️ MCP (Model Context Protocol) configuration templates

## Installation

```bash
npm install -g claude-foundation
```

Or use npx directly:

```bash
npx claude-foundation init
```

## Usage

### Basic Initialization

```bash
# Initialize in your project directory
claude-foundation init
```

### Complete Initialization (Recommended for new projects)

```bash
# Complete all initialization steps at once
claude-foundation init --with-hooks --write-db-local-env
```

### Targeted Functions

```bash
# Refresh foundation-managed hook command paths
claude-foundation init --refresh-hooks

# Refresh database conventions
claude-foundation init --refresh-db-convention

# Refresh browser testing conventions  
claude-foundation init --refresh-browser-convention

# Generate local database environment config file
claude-foundation init --write-db-local-env

# Specify different database container name
claude-foundation init --write-db-local-env --db-container-name my-mysql
```

## Project Structure

The following structure is created after initialization:

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

Default policy:

- Create when target doesn't exist
- Skip when target already exists
- No full-file merge
- No automatic overwrite of existing content

## Database Convention Injection

Initialization automatically includes a local database convention:

- Adds a managed `Local Database Convention` block in `CLAUDE.md`
- Creates `DB_LOCAL.md`
- Default convention prefers reusing local Docker MySQL container `mysql80-local`
- Connection info prioritizes reading from project `.env`, then `~/.db-local.env`

### `--refresh-db-convention`

To supplement or refresh database conventions for existing projects:

- Create if `DB_LOCAL.md` doesn't exist
- Refresh if `DB_LOCAL.md` already exists
- Update the managed database block in `CLAUDE.md` if it exists
- Insert automatically if `CLAUDE.md` doesn't have that block yet

## Browser Testing Convention Injection

Initialization automatically includes browser testing conventions:

- Adds a managed `Browser Testing Convention` block in `CLAUDE.md`
- Creates `BROWSER_TESTING.md`
- Browser/UI/regression tests default to Playwright
- Prioritize calling locally installed Chrome
- Fall back to Playwright's built-in Chromium when local Chrome is unavailable

### `--refresh-browser-convention`

To supplement or refresh browser conventions for existing projects:

- Create if `BROWSER_TESTING.md` doesn't exist
- Refresh if `BROWSER_TESTING.md` already exists
- Update the managed browser block in `CLAUDE.md` if it exists
- Insert automatically if `CLAUDE.md` doesn't have that block yet

## Memory System

After initialization, two layers of memory storage are prepared:

- `.claude/memory/`: Raw text index and metadata for project long-term memory
- `.claude/memory.lancedb/`: Vector database directory

## Hooks

`--with-hooks` will additionally and safely merge project-level `.claude/settings.json`:

- Write only project-level settings
- Only merge `hooks`
- Don't overwrite existing other settings
- Don't delete existing hooks
- Default to connecting `SessionStart`, `SessionEnd`, `PreCompact`, `UserPromptSubmit`

## License

MIT