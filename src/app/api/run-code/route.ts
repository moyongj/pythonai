import { NextResponse } from 'next/server';
import { spawnSync } from 'child_process';

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

    const result = spawnSync('python', ['-c', `import sys; sys.stdout.reconfigure(encoding='utf-8'); sys.stderr.reconfigure(encoding='utf-8');\n${code}`], {
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
