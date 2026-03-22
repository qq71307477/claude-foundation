#!/usr/bin/env node
import { runInit } from '../src/init.js';
import { runMemoryHook } from '../src/memory-manager.js';

function printHelp() {
  process.stdout.write(`claude-foundation\n\nUsage:\n  claude-foundation init [--with-hooks] [--refresh-hooks] [--refresh-db-convention] [--refresh-browser-convention] [--write-db-local-env] [--db-container-name <name>]\n  claude-foundation memory-hook\n  claude-foundation --help\n\nCommands:\n  init             Initialize Claude foundation files in the current project\n  memory-hook      Read a UserPromptSubmit payload from stdin and emit hook context JSON\n\nOptions:\n  --with-hooks                 Safely merge project hook settings into .claude/settings.json\n  --refresh-hooks              Refresh foundation-managed hook commands to the current node path\n  --refresh-db-convention      Refresh managed database convention files and CLAUDE.md block\n  --refresh-browser-convention Refresh managed browser convention files and CLAUDE.md block\n  --write-db-local-env         Inspect the local MySQL Docker container and create ~/.db-local.env if missing\n  --db-container-name          Override the default MySQL container name (default: mysql80-local)\n`);
}

function parseInitArgs(args) {
  const options = {
    withHooks: false,
    refreshHooks: false,
    refreshDbConvention: false,
    refreshBrowserConvention: false,
    writeDbLocalEnv: false,
    dbContainerName: 'mysql80-local',
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--with-hooks') {
      options.withHooks = true;
      continue;
    }

    if (arg === '--refresh-hooks') {
      options.refreshHooks = true;
      continue;
    }

    if (arg === '--refresh-db-convention') {
      options.refreshDbConvention = true;
      continue;
    }

    if (arg === '--refresh-browser-convention') {
      options.refreshBrowserConvention = true;
      continue;
    }

    if (arg === '--write-db-local-env') {
      options.writeDbLocalEnv = true;
      continue;
    }

    if (arg === '--db-container-name') {
      const value = args[index + 1];

      if (!value || value.startsWith('--')) {
        throw new Error('Missing value for --db-container-name');
      }

      options.dbContainerName = value;
      index += 1;
      continue;
    }

    throw new Error(`Unknown option for init: ${arg}`);
  }

  return options;
}

async function main() {
  const [command, ...args] = process.argv.slice(2);

  if (!command || command === '--help' || command === '-h' || command === 'help') {
    printHelp();
    process.exit(command ? 0 : 1);
  }

  if (command === 'init') {
    await runInit(parseInitArgs(args));
    return;
  }

  if (command === 'memory-hook') {
    await runMemoryHook();
    return;
  }

  process.stderr.write(`Unknown command: ${command}\n\n`);
  printHelp();
  process.exit(1);
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});