import { NextResponse } from 'next/server';
import { getLearningResources, addLearningResource, updateLearningResource, deleteLearningResource } from '@/lib/db';

/**
 * 获取学习资源列表
 */
export async function GET() {
  try {
    const resources = getLearningResources();
    return NextResponse.json({ success: true, resources });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '获取学习资源失败' },
      { status: 500 }
    );
  }
}

/**
 * 添加学习资源
 */
export async function POST(request: Request) {
  try {
    const { title, url, description, sortOrder } = await request.json();

    if (!title || !url) {
      return NextResponse.json(
        { success: false, error: '请提供资源标题和链接' },
        { status: 400 }
      );
    }

    const resource = addLearningResource({ title, url, description, sortOrder });
    return NextResponse.json({ success: true, resource });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '添加学习资源失败' },
      { status: 500 }
    );
  }
}

/**
 * 更新学习资源
 */
export async function PUT(request: Request) {
  try {
    const { id, data } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: '请提供资源ID' },
        { status: 400 }
      );
    }

    const success = updateLearningResource(id, data);
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
      { success: false, error: '更新学习资源失败' },
      { status: 500 }
    );
  }
}

/**
 * 删除学习资源
 */
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: '请提供资源ID' },
        { status: 400 }
      );
    }

    const success = deleteLearningResource(id);
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
      { success: false, error: '删除学习资源失败' },
      { status: 500 }
    );
  }
}
