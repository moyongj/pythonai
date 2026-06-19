/**
 * 学情记录API路由
 * 
 * 提供学生代码评价记录的增删查功能，用于管理和展示学情数据。
 * - GET：获取学情记录列表，支持通过studentId参数筛选指定学生的记录
 * - POST：添加新的学情评价记录（包含题目、代码、评价、分数）
 * - DELETE：删除指定评价记录
 * 
 * 学情记录数据结构：
 * - studentId：学生学号
 * - question：题目内容
 * - code：学生提交的代码
 * - report：AI生成的评价报告（JSON格式，含知识点、错误分析等）
 * - score：综合评分（0-100分）
 * 
 * @module api/evaluations
 * @author MYJ
 * @version 1.0.0
 */

import { NextResponse } from 'next/server';
import { getEvaluations, getStudentEvaluations, addEvaluation, deleteEvaluation } from '@/lib/db';

/**
 * 获取学情记录
 * 可通过studentId参数获取指定学生的记录
 * 
 * @param {Request} request - HTTP请求对象，支持searchParams.studentId查询参数
 * @returns {NextResponse} 评价记录列表响应
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