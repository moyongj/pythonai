import { NextResponse } from 'next/server';
import { getStatistics, getAllRecords, getKnowledgePointsStats, searchRecords, getAllStudentNames } from '@/lib/db';
import * as XLSX from 'xlsx';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const action = url.searchParams.get('action');

    if (action === 'export') {
      const studentName = url.searchParams.get('studentName');
      const knowledgePoint = url.searchParams.get('knowledgePoint');
      const minScore = url.searchParams.get('minScore') ? parseInt(url.searchParams.get('minScore')!) : undefined;
      const maxScore = url.searchParams.get('maxScore') ? parseInt(url.searchParams.get('maxScore')!) : undefined;

      let records: any[];
      let fileName = 'all_records';

      if (studentName && !knowledgePoint && minScore === undefined && maxScore === undefined) {
        records = await searchRecords({ studentName }) as any[];
        fileName = `学生_${studentName}_评价记录`;
      } else if (knowledgePoint && !studentName && minScore === undefined && maxScore === undefined) {
        records = await searchRecords({ knowledgePoint }) as any[];
        const shortKpName = knowledgePoint.length > 20 ? knowledgePoint.substring(0, 20) : knowledgePoint;
        fileName = `知识点_${shortKpName}_评价记录`;
      } else if (studentName || knowledgePoint || minScore !== undefined || maxScore !== undefined) {
        records = await searchRecords({ studentName, knowledgePoint, minScore, maxScore }) as any[];
        fileName = '筛选结果_评价记录';
      } else {
        records = await getAllRecords() as any[];
        fileName = '全部评价记录';
      }

      const worksheetData = records.map(r => {
        const date = new Date(r.created_at);
        const isValidDate = !isNaN(date.getTime());
        return {
          '学生姓名': r.student_name || '',
          '题目': r.question || '',
          '代码': r.code || '',
          '理解得分': r.understanding_score || 0,
          '逻辑得分': r.logic_score || 0,
          '可读性得分': r.readability_score || 0,
          '语法得分': r.syntax_score || 0,
          '总分': r.total_score || 0,
          '等级': r.level || '',
          '提示': r.hint || '',
          '练习建议': r.practice || '',
          '易错知识点': (r.knowledgePoints || []).join('; '),
          '评价时间': isValidDate ? date.toLocaleString('zh-CN') : '',
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '评价记录');

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

      return new NextResponse(excelBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}.xlsx"`,
        },
      });
    }

    if (action === 'search') {
      const studentName = url.searchParams.get('studentName');
      const knowledgePoint = url.searchParams.get('knowledgePoint');
      const minScore = url.searchParams.get('minScore') ? parseInt(url.searchParams.get('minScore')!) : undefined;
      const maxScore = url.searchParams.get('maxScore') ? parseInt(url.searchParams.get('maxScore')!) : undefined;

      const records = await searchRecords({ studentName, knowledgePoint, minScore, maxScore }) as any[];

      const totalPages = Math.ceil(records.length / limit);
      const offset = (page - 1) * limit;
      const paginatedRecords = records.slice(offset, offset + limit);

      const searchRecordsData = paginatedRecords.map(r => {
        const date = new Date(r.created_at);
        const isValidDate = !isNaN(date.getTime());
        return {
          name: r.student_name || '未知',
          title: (r.question?.length > 20 ? r.question.substring(0, 20) + '...' : r.question) || '无标题',
          score: r.total_score || 0,
          level: r.level || '待提升',
          kp: (r.knowledgePoints?.length > 0 ? r.knowledgePoints[0] : '无') || '无',
          time: isValidDate ? date.toLocaleString('zh-CN') : '未知时间',
        };
      });

      return NextResponse.json({
        success: true,
        data: {
          records: searchRecordsData,
          pagination: {
            page,
            limit,
            totalPages,
            totalRecords: records.length,
          },
        },
      });
    }

    if (action === 'names') {
      const names = await getAllStudentNames();
      return NextResponse.json({ success: true, data: names });
    }

    if (action === 'knowledgePoints') {
      const kpStats = await getKnowledgePointsStats();
      return NextResponse.json({ success: true, data: kpStats });
    }

    const [stats, records, kpStats] = await Promise.all([
      getStatistics(),
      getAllRecords(),
      getKnowledgePointsStats(),
    ]);

    const distribution = [
      { range: '85-100', count: stats.excellentCount as number, color: 'bg-accent-pink', text: 'text-accent-pink' },
      { range: '70-84', count: stats.goodCount as number, color: 'bg-accent-green', text: 'text-accent-green' },
      { range: '60-69', count: stats.passCount as number, color: 'bg-primary', text: 'text-primary' },
      { range: '0-59', count: stats.failCount as number, color: 'bg-destructive', text: 'text-destructive' },
    ];

    const topKp = (kpStats as { name: string; count: number }[])
      .slice(0, 5)
      .map(kp => ({
        ...kp,
        percent: kpStats.length > 0 ? (kp.count / kpStats[0].count) * 100 : 0,
      }));

    const totalPages = Math.ceil(records.length / limit);
    const offset = (page - 1) * limit;
    const paginatedRecords = records.slice(offset, offset + limit);

    const recentRecords = paginatedRecords.map(r => {
      const date = new Date(r.created_at);
      const isValidDate = !isNaN(date.getTime());
      return {
        name: r.student_name || '未知',
        title: (r.question?.length > 20 ? r.question.substring(0, 20) + '...' : r.question) || '无标题',
        score: r.total_score || 0,
        level: r.level || '待提升',
        kp: (r.knowledgePoints?.length > 0 ? r.knowledgePoints[0] : '无') || '无',
        time: isValidDate ? date.toLocaleString('zh-CN') : '未知时间',
      };
    });

    const dimensionStats = records.length > 0 ? {
      understanding: Math.round(records.reduce((sum, r) => sum + (r.understanding_score || 0), 0) / records.length),
      logic: Math.round(records.reduce((sum, r) => sum + (r.logic_score || 0), 0) / records.length),
      readability: Math.round(records.reduce((sum, r) => sum + (r.readability_score || 0), 0) / records.length),
      syntax: Math.round(records.reduce((sum, r) => sum + (r.syntax_score || 0), 0) / records.length),
    } : { understanding: 0, logic: 0, readability: 0, syntax: 0 };

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalCount: stats.totalCount,
          avgScore: Number(stats.avgScore).toFixed(1),
          excellentRate: Number(stats.excellentRate).toFixed(1),
          kpCount: (kpStats as { name: string; count: number }[]).length,
        },
        distribution,
        topKp,
        recentRecords,
        dimensionStats,
        pagination: {
          page,
          limit,
          totalPages,
          totalRecords: records.length,
        },
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : '获取统计数据失败';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}