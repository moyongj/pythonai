/**
 * 题库管理API路由
 * 
 * 提供Python编程练习题的增删改查功能，支持管理员维护题库。
 * - GET：获取所有题目列表
 * - POST：添加新题目（包含标题、内容、提示和示例代码）
 * - PUT：更新现有题目信息
 * - DELETE：删除指定题目
 * 
 * 题目数据结构包含：
 * - title：题目标题
 * - content：题目详细描述
 * - hint：解题提示
 * - exampleCode：参考答案代码
 * 
 * @module api/questions
 * @author MYJ
 * @version 1.0.0
 */

import { NextResponse } from 'next/server';
import { getQuestions, addQuestion, updateQuestion, deleteQuestion } from '@/lib/db';

/**
 * 获取题库列表
 * 
 * @returns {NextResponse} 题目列表响应，包含所有题目数据
 */
export async function GET() {
  try {
    const questions = getQuestions();
    return NextResponse.json({ success: true, questions });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '获取题库失败' },
      { status: 500 }
    );
  }
}

/**
 * 添加题目
 */
export async function POST(request: Request) {
  try {
    const { title, content, hint, exampleCode } = await request.json();
    
    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: '请提供题目标题和内容' },
        { status: 400 }
      );
    }

    const question = addQuestion({ title, content, hint: hint || '', exampleCode: exampleCode || '' });
    return NextResponse.json({ success: true, question });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '添加题目失败' },
      { status: 500 }
    );
  }
}

/**
 * 更新题目
 */
export async function PUT(request: Request) {
  try {
    const { id, data } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: '请提供题目ID' },
        { status: 400 }
      );
    }

    const success = updateQuestion(id, data);
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: '更新失败' },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '更新题目失败' },
      { status: 500 }
    );
  }
}

/**
 * 删除题目
 */
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: '请提供题目ID' },
        { status: 400 }
      );
    }

    const success = deleteQuestion(id);
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: '删除失败' },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '删除题目失败' },
      { status: 500 }
    );
  }
}