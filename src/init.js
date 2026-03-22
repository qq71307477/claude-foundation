import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import child_process from 'child_process';
import { copyDirAssets } from './copy-utils.js';

export async function runInit(options) {
  const {
    withHooks,
    refreshHooks,
    refreshDbConvention,
    refreshBrowserConvention,
    writeDbLocalEnv,
    dbContainerName,
  } = options;

  if (writeDbLocalEnv) {
    await writeDbLocalEnvFile(dbContainerName);
  }

  if (refreshDbConvention) {
    await refreshDbConventionFiles();
  }

  if (refreshBrowserConvention) {
    await refreshBrowserConventionFiles();
  }

  if (withHooks || refreshHooks) {
    await setupHooks(withHooks, refreshHooks);
  }

  // Base foundation files should always be copied
  await copyFoundationFiles();

  console.log('Claude foundation initialized successfully!');
}

async function copyFoundationFiles() {
  const assetsDir = path.join(path.dirname(new URL(import.meta.url).pathname), '../assets');
  const targetDir = '.';
  await copyDirAssets(assetsDir, targetDir);
}

async function setupHooks(withHooks, refreshHooks) {
  const settingsPath = './.claude/settings.json';
  let settings = {};

  // Load existing settings if they exist
  if (fs.existsSync(settingsPath)) {
    settings = JSON.parse(await fs.readFile(settingsPath, 'utf8'));
  }

  // Ensure hooks section exists
  if (!settings.hooks) {
    settings.hooks = {};
  }

  const currentNodePath = process.execPath;
  const hookCommand = `${currentNodePath} ${path.resolve('./foundation_npm/bin/claude-foundation.js')} memory-hook`;

  if (withHooks) {
    // Only add hooks that don't already exist
    if (!settings.hooks['SessionStart']) {
      settings.hooks['SessionStart'] = [];
    }
    if (!settings.hooks['SessionEnd']) {
      settings.hooks['SessionEnd'] = [];
    }
    if (!settings.hooks['PreCompact']) {
      settings.hooks['PreCompact'] = [];
    }
    if (!settings.hooks['UserPromptSubmit']) {
      settings.hooks['UserPromptSubmit'] = [];
    }

    // Add foundation hooks to the beginning of each array
    if (!settings.hooks['SessionStart'].includes(hookCommand)) {
      settings.hooks['SessionStart'].unshift(hookCommand);
    }
    if (!settings.hooks['SessionEnd'].includes(hookCommand)) {
      settings.hooks['SessionEnd'].unshift(hookCommand);
    }
    if (!settings.hooks['PreCompact'].includes(hookCommand)) {
      settings.hooks['PreCompact'].unshift(hookCommand);
    }
    if (!settings.hooks['UserPromptSubmit'].includes(hookCommand)) {
      settings.hooks['UserPromptSubmit'].unshift(hookCommand);
    }
  }

  if (refreshHooks) {
    // Update all foundation hook commands to use the current node path
    ['SessionStart', 'SessionEnd', 'PreCompact', 'UserPromptSubmit'].forEach(hookName => {
      if (settings.hooks[hookName]) {
        settings.hooks[hookName] = settings.hooks[hookName].map(cmd => 
          cmd.includes('claude-foundation.js memory-hook') ? hookCommand : cmd
        );
      }
    });
  }

  // Write settings file
  await fs.outputFile(settingsPath, JSON.stringify(settings, null, 2));
}

async function refreshDbConventionFiles() {
  // Read existing CLAUDE.md if it exists
  const claudePath = './CLAUDE.md';
  let claudeContent = '';
  if (fs.existsSync(claudePath)) {
    claudeContent = await fs.readFile(claudePath, 'utf8');
  }

  // Replace or add the database convention block
  const dbBlockStart = '<!-- foundation:db-convention:start -->';
  const dbBlockEnd = '<!-- foundation:db-convention:end -->';
  
  const newDbBlock = `\n<!-- foundation:db-convention:start -->\n## Local Database Convention\n\n默认本机数据库约定见 \`DB_LOCAL.md\`.\n如果任务涉及建库、导入、查询、迁移或测试数据，默认直接使用 \`mysql80-local\`，无需再次确认；优先先阅读该文件。\n<!-- foundation:db-convention:end -->\n`;

  if (claudeContent.includes(dbBlockStart) && claudeContent.includes(dbBlockEnd)) {
    // Replace existing block
    const startIdx = claudeContent.indexOf(dbBlockStart);
    const endIdx = claudeContent.indexOf(dbBlockEnd) + dbBlockEnd.length;
    claudeContent = claudeContent.substring(0, startIdx) + newDbBlock + claudeContent.substring(endIdx);
  } else {
    // Add block to the end
    claudeContent += newDbBlock;
  }

  await fs.writeFile(claudePath, claudeContent);

  // Create or update DB_LOCAL.md
  const dbLocalPath = './DB_LOCAL.md';
  const dbLocalContent = `# DB_LOCAL.md Template\n\n## Connection\n\n- Host: 127.0.0.1\n- Port: 3306 (or mapped port)\n- User: root\n- Database: [your_db_name]\n\n## Default MySQL Container\n\nDefault container name: \`mysql80-local\`\n\n## Credentials\n\nCredentials priority:\n\n1. Project \`.env\`\n2. User \`.db-local.env\`\n\nFor initial setup, run: \`claude-foundation init --write-db-local-env\` to generate \`~/.db-local.env\` from container.\n`;
  await fs.writeFile(dbLocalPath, dbLocalContent);
}

async function refreshBrowserConventionFiles() {
  // Read existing CLAUDE.md if it exists
  const claudePath = './CLAUDE.md';
  let claudeContent = '';
  if (fs.existsSync(claudePath)) {
    claudeContent = await fs.readFile(claudePath, 'utf8');
  }

  // Replace or add the browser convention block
  const browserBlockStart = '<!-- foundation:browser-convention:start -->';
  const browserBlockEnd = '<!-- foundation:browser-convention:end -->';
  
  const newBrowserBlock = `\n<!-- foundation:browser-convention:start -->\n## Browser Testing Convention\n\n默认浏览器约定见 \`BROWSER_TESTING.md\`.\n如果任务涉及页面回归、UI smoke、交互验证或页面侦察，默认使用 Playwright；优先调用本机 Chrome，本机 Chrome 不可用时再退回 Playwright 自带 Chromium。\n<!-- foundation:browser-convention:end -->\n`;

  if (claudeContent.includes(browserBlockStart) && claudeContent.includes(browserBlockEnd)) {
    // Replace existing block
    const startIdx = claudeContent.indexOf(browserBlockStart);
    const endIdx = claudeContent.indexOf(browserBlockEnd) + browserBlockEnd.length;
    claudeContent = claudeContent.substring(0, startIdx) + newBrowserBlock + claudeContent.substring(endIdx);
  } else {
    // Add block to the end
    claudeContent += newBrowserBlock;
  }

  await fs.writeFile(claudePath, claudeContent);

  // Create or update BROWSER_TESTING.md
  const browserTestingPath = './BROWSER_TESTING.md';
  const browserTestingContent = `# BROWSER_TESTING.md Template\n\n## Default Browser\n\n- Primary: Local Chrome (if available)\n- Fallback: Playwright Chromium\n- Framework: Playwright\n\n## Configuration\n\nDefault Playwright configuration:\n\n- Use local installed Chrome when possible\n- Fallback to Playwright Chromium if local Chrome unavailable\n- Headless mode for CI\n`;
  await fs.writeFile(browserTestingPath, browserTestingContent);
}

async function writeDbLocalEnvFile(containerName) {
  const envPath = path.join(os.homedir(), '.db-local.env');
  
  // Don't overwrite if file already exists
  if (fs.existsSync(envPath)) {
    console.log(\`~/.db-local.env already exists, skipping creation. Remove it first if you want to regenerate.\`);
    return;
  }
  
  try {
    // Get container details
    const inspectResult = child_process.execSync(`docker inspect ${containerName}`, { encoding: 'utf8' });
    const containerInfo = JSON.parse(inspectResult)[0];
    
    // Extract network settings
    const portBindings = containerInfo.HostConfig.PortBindings;
    const mySqlPort = portBindings['3306/tcp'][0].HostPort;
    
    // Get root password from environment
    const envVars = containerInfo.Config.Env;
    let rootPassword = 'rootpassword';
    for (const envVar of envVars) {
      if (envVar.startsWith('MYSQL_ROOT_PASSWORD=')) {
        rootPassword = envVar.split('=')[1];
        break;
      }
    }
    
    // Create a sample database name
    const dbName = 'testdb';
    
    // Generate env content
    const envContent = `MYSQL_CONTAINER=${containerName}\nDB_HOST=127.0.0.1\nDB_PORT=${mySqlPort}\nDB_USER=root\nDB_PASSWORD=${rootPassword}\nDB_NAME=${dbName}\n`;
    
    // Write to file
    await fs.writeFile(envPath, envContent);
    console.log(`Generated ~/.db-local.env for ${containerName}`);
  } catch (error) {
    console.error(`Failed to generate ~/.db-local.env: ${error.message}`);
    throw error;
  }
}
