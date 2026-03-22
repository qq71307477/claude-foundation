import fs from 'fs-extra';
import path from 'path';

/**
 * Copy all files from assets directory to target directory, preserving directory structure.
 */
export async function copyDirAssets(assetsDir, targetDir) {
  // Get all items in the assets directory
  const items = await fs.readdir(assetsDir);
  
  for (const item of items) {
    const assetPath = path.join(assetsDir, item);
    const targetPath = path.join(targetDir, item);
    
    const stat = await fs.stat(assetPath);
    
    if (stat.isDirectory()) {
      // Recursively copy directories
      await copyDirAssets(assetPath, targetPath);
    } else {
      // Copy files, but don't overwrite existing files
      if (!(await fs.pathExists(targetPath))) {
        await fs.copyFile(assetPath, targetPath);
      }
    }
  }
}
