import { NextResponse } from 'next/server';
import { getSession, deleteSession, getStudentById } from '@/lib/db';

/**
 * 验证session API
 */
export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: '无效的session' },
        { status: 400 }
      );
    }

    const session = getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'session已过期' },
        { status: 401 }
      );
    }

    if (session.userType === 'admin') {
      return NextResponse.json({
        success: true,
        userType: 'admin',
        user: { username: session.userId },
      });
    } else {
      const student = getStudentById(session.userId);
      if (!student) {
        return NextResponse.json(
          { success: false, error: '学生信息不存在' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        userType: 'student',
        user: {
          id: student.id,
          studentId: student.studentId,
          name: student.name,
          class: student.class,
        },
      });
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '验证失败' },
      { status: 500 }
    );
  }
}

/**
 * 退出登录 API
 */
export async function DELETE(request: Request) {
  try {
    const { sessionId } = await request.json();
    
    if (sessionId) {
      deleteSession(sessionId);
    }
    
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}