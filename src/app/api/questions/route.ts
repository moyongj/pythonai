import { NextResponse } from 'next/server';
import { getQuestions, addQuestion, updateQuestion, deleteQuestion } from '@/lib/db';

/**
 * 获取题库列表
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