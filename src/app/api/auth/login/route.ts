/**
 * 用户登录API路由
 * 
 * 处理管理员和学生的登录请求，验证用户身份并创建会话。
 * 
 * @module api/auth/login
 * @author MYJ
 * @version 1.0.0
 */

import { NextResponse } from 'next/server';
import { validateAdminLogin, validateStudentLogin, createSession } from '@/lib/db';

/**
 * 处理POST登录请求
 * 
 * @param {Request} request - HTTP请求对象
 * @returns {NextResponse} 登录结果响应
 */
export async function POST(request: Request) {
  try {
    // 解析请求体中的登录信息
    const { type, username, password } = await request.json();

    // 验证必填字段
    if (!type || !username || !password) {
      return NextResponse.json(
        { success: false, error: '请填写完整的登录信息' },
        { status: 400 }
      );
    }

    // 管理员登录处理
    if (type === 'admin') {
      // 验证管理员账号密码
      if (validateAdminLogin(username, password)) {
        // 创建管理员会话
        const sessionId = createSession('admin', username);
        const response = NextResponse.json({
          success: true,
          sessionId,
          userType: 'admin',
          user: { username },
        });
        // 设置会话Cookie
        response.cookies.set('mscz_session_id', sessionId, {
          maxAge: 24 * 60 * 60, // 24小时过期
          path: '/',
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production', // 生产环境启用HTTPS
        });
        return response;
      } else {
        return NextResponse.json(
          { success: false, error: '管理员账号或密码错误' },
          { status: 401 }
        );
      }
    } else if (type === 'student') {
      // 学生登录处理
      const student = validateStudentLogin(username, password);
      if (student) {
        // 创建学生会话
        const sessionId = createSession('student', student.studentId);
        const response = NextResponse.json({
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
        // 设置会话Cookie
        response.cookies.set('mscz_session_id', sessionId, {
          maxAge: 24 * 60 * 60, // 24小时过期
          path: '/',
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
        });
        return response;
      } else {
        return NextResponse.json(
          { success: false, error: '学号或密码错误' },
          { status: 401 }
        );
      }
    } else {
      // 无效的登录类型
      return NextResponse.json(
        { success: false, error: '无效的登录类型' },
        { status: 400 }
      );
    }
  } catch (error) {
    // 服务器内部错误处理
    return NextResponse.json(
      { success: false, error: '登录失败，请稍后重试' },
      { status: 500 }
    );
  }
}
