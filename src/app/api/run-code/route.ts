import { NextResponse } from 'next/server';
import { spawnSync, execSync } from 'child_process';

function decodeOutput(buffer: Buffer | undefined): string {
  if (!buffer) return '';
  
  // 尝试不同的编码
  const encodings = ['utf-8', 'gbk', 'gb2312', 'gb18030', 'big5'];
  
  for (const encoding of encodings) {
    try {
      const decoder = new TextDecoder(encoding);
      const decoded = decoder.decode(buffer);
      if (!/[\uFFFD]/.test(decoded)) {
        return decoded;
      }
    } catch {
      continue;
    }
  }
  
  // 最后尝试用UTF-8并替换无效字符
  try {
    const decoder = new TextDecoder('utf-8', { fatal: false });
    return decoder.decode(buffer);
  } catch {
    return buffer.toString('latin1');
  }
}

/**
 * 自动检测 Python 可执行文件的路径
 * 
 * 优先顺序：
 * 1. 环境变量 PYTHON_PATH 指定的路径
 * 2. python3 (Linux/Mac 默认)
 * 3. python (Windows 默认)
 * 4. python3.11, python3.10 等常见版本
 * 5. which/where 命令检测
 * 
 * @returns 可用的 Python 可执行文件路径
 */
function detectPythonPath(): string {
  // 优先使用环境变量
  const envPath = process.env.PYTHON_PATH;
  if (envPath) {
    const testResult = spawnSync(envPath, ['--version']);
    if (testResult.status === 0) {
      return envPath;
    }
  }

  // 尝试常见的 Python 路径
  const candidates = [
    'python3',
    'python',
    'python3.12',
    'python3.11',
    'python3.10',
    'python3.9',
    '/usr/bin/python3',
    '/usr/bin/python',
    '/usr/local/bin/python3',
    '/www/server/pypy/bin/pypy3',
    '/www/server/python3/bin/python3',
  ];

  for (const candidate of candidates) {
    try {
      const result = spawnSync(candidate, ['--version'], {
        timeout: 2000,
      });
      if (result.status === 0) {
        return candidate;
      }
    } catch {
      continue;
    }
  }

  // 尝试用 which/where 命令检测
  try {
    const isWindows = process.platform === 'win32';
    const whichCmd = isWindows ? 'where python' : 'which python3';
    const output = execSync(whichCmd, { timeout: 2000 }).toString().trim();
    if (output) {
      return output.split('\n')[0].trim();
    }
  } catch {
    // 忽略检测失败
  }

  // 最后返回默认值
  return 'python3';
}

export async function POST(request: Request) {
  try {
    const { code, inputs } = await request.json();
    
    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, error: '代码不能为空' },
        { status: 400 }
      );
    }

    const inputString = Array.isArray(inputs) ? inputs.join('\n') + '\n' : '';

    // 自动检测 Python 路径
    const pythonPath = detectPythonPath();
    
    const pythonCode = `
import sys
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

# 重写 input() 函数，忽略提示文本，避免提示出现在输出中
_original_input = input
def _safe_input(prompt=''):
    return _original_input()
input = _safe_input

${code}
`;
    
    const result = spawnSync(pythonPath, ['-c', pythonCode], {
      timeout: 10000,
      maxBuffer: 1024 * 1024,
      stdio: ['pipe', 'pipe', 'pipe'],
      input: inputString,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    });

    const stdout = decodeOutput(result.stdout);
    const stderr = decodeOutput(result.stderr);
    
    if (result.status === 0) {
      return NextResponse.json({
        success: true,
        output: stdout || '执行完成，无输出',
      });
    } else {
      const errorMessage = stderr || stdout || '执行失败';
      if (errorMessage.includes('EOFError')) {
        return NextResponse.json({
          success: false,
          error: errorMessage,
          needInput: true,
        });
      }
      // 如果 Python 进程无法启动，提供更详细的错误信息
      if (result.error) {
        return NextResponse.json({
          success: false,
          error: `Python执行失败 (${pythonPath}): ${result.error.message}，请检查服务器是否安装了 Python 或配置 PYTHON_PATH 环境变量`,
        });
      }
      return NextResponse.json({
        success: false,
        error: errorMessage,
      });
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '执行失败' },
      { status: 500 }
    );
  }
}
