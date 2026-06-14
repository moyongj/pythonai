import { NextResponse } from 'next/server';
import { getEvaluations, getStudentEvaluations, addEvaluation, deleteEvaluation } from '@/lib/db';

/**
 * 获取学情记录
 * 可通过studentId参数获取指定学生的记录
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (studentId) {
      const evaluations = getStudentEvaluations(studentId);
      return NextResponse.json({ success: true, evaluations });
    } else {
      const evaluations = getEvaluations();
      return NextResponse.json({ success: true, evaluations });
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '获取学情记录失败' },
      { status: 500 }
    );
  }
}

/**
 * 添加学情记录
 */
export async function POST(request: Request) {
  try {
    const { studentId, question, code, report, score } = await request.json();
    
    if (!studentId || !question || !code || !report || score === undefined) {
      return NextResponse.json(
        { success: false, error: '请提供完整的学情记录信息' },
        { status: 400 }
      );
    }

    const record = addEvaluation({ studentId, question, code, report, score });
    return NextResponse.json({ success: true, record });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '添加学情记录失败' },
      { status: 500 }
    );
  }
}

/**
 * 删除学情记录
 */
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: '请提供记录ID' },
        { status: 400 }
      );
    }

    const success = deleteEvaluation(id);
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
      { success: false, error: '删除学情记录失败' },
      { status: 500 }
    );
  }
}