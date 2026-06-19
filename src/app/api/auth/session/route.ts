/**
 * 会话管理API路由
 * 
 * 处理用户会话的验证和注销功能。
 * - POST：验证当前session是否有效并返回用户信息
 * - DELETE：删除session实现用户退出登录
 * 
 * @module api/auth/session
 * @author MYJ
 * @version 1.0.0
 */

import { NextResponse } from 'next/server';
import { getSession, deleteSession, getStudentById } from '@/lib/db';

/**
 * 验证session API
 * 
 * 接收sessionId，查询数据库中的session信息，判断session是否有效。
 * 如果是管理员session，返回管理员信息；如果是学生session，返回学生信息。
 * 
 * @param {Request} request - HTTP请求对象
 * @returns {NextResponse} 验证结果响应，包含用户类型和用户信息
 */
export async function POST(request: Request) {
  try {
    // 解析请求体中的sessionId
    const { sessionId } = await request.json();

    // 验证必填字段
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: '无效的session' },
        { status: 400 }
      );
    }

    // 从数据库查询session信息
    const session = getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'session已过期' },
        { status: 401 }
      );
    }

    // 根据用户类型返回不同的用户信息
    if (session.userType === 'admin') {
      return NextResponse.json({
        success: true,
        userType: 'admin',
        user: { username: session.userId },
      });
    } else {
      // 学生用户：查询学生详细信息
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
    // 服务器内部错误处理
    return NextResponse.json(
      { success: false, error: '验证失败' },
      { status: 500 }
    );
  }
}

/**
 * 退出登录API
 * 
 * 接收sessionId，从数据库删除session实现用户注销。
 * 
 * @param {Request} request - HTTP请求对象
 * @returns {NextResponse} 注销结果响应
 */
export async function DELETE(request: Request) {
  try {
    const { sessionId } = await request.json();
    
    // 如果sessionId存在，从数据库删除session
    if (sessionId) {
      deleteSession(sessionId);
    }
    
    return NextResponse.json({ success: true });
  } catch {
    // 即使删除失败也返回成功，避免前端阻塞
    return NextResponse.json({ success: true });
  }
}