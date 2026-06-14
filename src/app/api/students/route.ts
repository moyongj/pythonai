import { NextResponse } from 'next/server';
import { getStudents, addStudentsBatch, updateStudent, deleteStudent } from '@/lib/db';

/**
 * 获取学生列表
 */
export async function GET() {
  try {
    const students = getStudents();
    return NextResponse.json({ success: true, students });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '获取学生列表失败' },
      { status: 500 }
    );
  }
}

/**
 * 批量添加学生
 */
export async function POST(request: Request) {
  try {
    const { students } = await request.json();
    
    if (!students || !Array.isArray(students)) {
      return NextResponse.json(
        { success: false, error: '请提供学生数据数组' },
        { status: 400 }
      );
    }

    const validStudents = students
      .filter((s: { class?: string; name?: string; studentId?: string; password?: string }) => s.studentId && s.name)
      .map((s: { class?: string; name?: string; studentId?: string; password?: string }) => ({
        class: s.class || '',
        name: s.name,
        studentId: s.studentId,
        password: s.password || '123456',
      }));

    if (validStudents.length === 0) {
      return NextResponse.json(
        { success: false, error: '没有有效的学生数据' },
        { status: 400 }
      );
    }

    const count = addStudentsBatch(validStudents);
    return NextResponse.json({
      success: true,
      message: `成功导入 ${count} 名学生`,
      count,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '导入学生失败' },
      { status: 500 }
    );
  }
}

/**
 * 更新学生信息
 */
export async function PUT(request: Request) {
  try {
    const { id, data } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: '请提供学生ID' },
        { status: 400 }
      );
    }

    const success = updateStudent(id, data);
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
      { success: false, error: '更新学生信息失败' },
      { status: 500 }
    );
  }
}

/**
 * 删除学生
 */
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: '请提供学生ID' },
        { status: 400 }
      );
    }

    const success = deleteStudent(id);
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
      { success: false, error: '删除学生失败' },
      { status: 500 }
    );
  }
}