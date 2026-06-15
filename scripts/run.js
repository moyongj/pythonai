/**
 * 跨平台脚本执行器
 * 根据操作系统自动选择对应的脚本
 */
const { execSync } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
const scriptType = args[0] || 'build';

const isWindows = process.platform === 'win32';

// 根据操作系统选择脚本
const scriptPath = isWindows 
  ? path.join(__dirname, `${scriptType}.cmd`)
  : path.join(__dirname, `${scriptType}.sh`);

console.log(`[cross-platform] Running ${scriptType} script...`);
console.log(`[cross-platform] OS: ${isWindows ? 'Windows' : 'Linux/Unix'}`);
console.log(`[cross-platform] Script: ${scriptPath}`);

try {
  execSync(isWindows ? `cmd /c "${scriptPath}"` : `bash "${scriptPath}"`, {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  console.log(`[cross-platform] ${scriptType} completed successfully!`);
} catch (error) {
  console.error(`[cross-platform] ${scriptType} failed with error:`, error.message);
  process.exit(1);
}