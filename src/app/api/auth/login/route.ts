import { NextResponse } from 'next/server';
import { validateAdminLogin, validateStudentLogin, createSession } from '@/lib/db';

/**
 * 登录API
 * 支持管理员和学生登录
 */
export async function POST(request: Request) {
  try {
    const { type, username, password } = await request.json();

    if (!type || !username || !password) {
      return NextResponse.json(
        { success: false, error: '请填写完整的登录信息' },
        { status: 400 }
      );
    }

    if (type === 'admin') {
      if (validateAdminLogin(username, password)) {
        const sessionId = createSession('admin', username);
        return NextResponse.json({
          success: true,
          sessionId,
          userType: 'admin',
          user: { username },
        });
      } else {
        return NextResponse.json(
          { success: false, error: '管理员账号或密码错误' },
          { status: 401 }
        );
      }
    } else if (type === 'student') {
      const student = validateStudentLogin(username, password);
      if (student) {
        const sessionId = createSession('student', student.studentId);
        return NextResponse.json({
          success: true,
          sessionId,
          userType: 'student',
          user: {
            id: student.id,
            studentId: student.studentId,
            name: student.name,
            class: student.class,
          },
        });
      } else {
        return NextResponse.json(
          { success: false, error: '学号或密码错误' },
          { status: 401 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: '无效的登录类型' },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '登录失败，请稍后重试' },
      { status: 500 }
    );
  }
}