import { NextResponse } from 'next/server';
import { getStatistics, getAllRecords, getKnowledgePointsStats, searchRecords, getAllStudentNames } from '@/lib/db';
import * as XLSX from 'xlsx';

export const runtime = 'nodejs';

interface EvaluationRecord {
  id: number;
  student_id: string;
  question: string;
  code: string;
  report: string;
  score: number;
  created_at: string;
  student_name?: string;
  student_class?: string;
}

/**
 * 从数据库 report 字段（JSON字符串）安全解析四维度分数等信息。
 * 数据库实际只存储 report JSON 和 score（总分），并不存在独立的
 * understanding_score / logic_score / readability_score / syntax_score 字段。
 */
function safeParseReport(report: string | undefined | null) {
  const empty = {
    understanding: 0,
    logic: 0,
    readability: 0,
    syntax: 0,
    totalScore: 0,
    level: '',
    hint: '',
    practice: '',
    knowledgePoints: [] as string[],
  };
  if (!report) return empty;
  try {
    const obj = JSON.parse(report);
    return {
      understanding: typeof obj.understandingScore === 'number' ? obj.understandingScore : 0,
      logic: typeof obj.logicScore === 'number' ? obj.logicScore : 0,
      readability: typeof obj.readabilityScore === 'number' ? obj.readabilityScore : 0,
      syntax: typeof obj.syntaxScore === 'number' ? obj.syntaxScore : 0,
      totalScore: typeof obj.totalScore === 'number' ? obj.totalScore : 0,
      level: typeof obj.level === 'string' ? obj.level : '',
      hint: typeof obj.hint === 'string' ? obj.hint : '',
      practice: typeof obj.practice === 'string' ? obj.practice : '',
      knowledgePoints: Array.isArray(obj.knowledgePoints) ? obj.knowledgePoints : [],
    };
  } catch {
    return empty;
  }
}

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

      let records: EvaluationRecord[];
      let fileName = 'all_records';

      if (studentName && !knowledgePoint && minScore === undefined && maxScore === undefined) {
        records = await searchRecords({ studentName }) as EvaluationRecord[];
        fileName = `学生_${studentName}_评价记录`;
      } else if (knowledgePoint && !studentName && minScore === undefined && maxScore === undefined) {
        records = await searchRecords({ knowledgePoint }) as EvaluationRecord[];
        const shortKpName = knowledgePoint.length > 20 ? knowledgePoint.substring(0, 20) : knowledgePoint;
        fileName = `知识点_${shortKpName}_评价记录`;
      } else if (studentName || knowledgePoint || minScore !== undefined || maxScore !== undefined) {
        records = await searchRecords({ studentName, knowledgePoint, minScore, maxScore }) as EvaluationRecord[];
        fileName = '筛选结果_评价记录';
      } else {
        records = await getAllRecords() as EvaluationRecord[];
        fileName = '全部评价记录';
      }

      const worksheetData = records.map(r => {
        const date = new Date(r.created_at);
        const isValidDate = !isNaN(date.getTime());
        const parsed = safeParseReport(r.report);
        return {
          '学生姓名': r.student_name || '',
          '班级': r.student_class || '',
          '题目': r.question || '',
          '代码': r.code || '',
          '理解得分': parsed.understanding,
          '逻辑得分': parsed.logic,
          '可读性得分': parsed.readability,
          '语法得分': parsed.syntax,
          '总分': r.score || 0,
          '等级': parsed.level,
          '提示': parsed.hint,
          '练习建议': parsed.practice,
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

      const records = await searchRecords({ studentName, knowledgePoint, minScore, maxScore }) as EvaluationRecord[];

      const totalPages = Math.ceil(records.length / limit);
      const offset = (page - 1) * limit;
      const paginatedRecords = records.slice(offset, offset + limit);

      const searchRecordsData = paginatedRecords.map(r => {
        const date = new Date(r.created_at);
        const isValidDate = !isNaN(date.getTime());
        const parsed = safeParseReport(r.report);
        const kpText = parsed.knowledgePoints?.slice(0, 3).join(';') || '无';
        return {
          name: r.student_name || '未知',
          class: r.student_class || '',
          title: (r.question?.length > 20 ? r.question.substring(0, 20) + '...' : r.question) || '无标题',
          score: r.score || 0,
          level: parsed.level || '待提升',
          kp: kpText.length > 30 ? kpText.substring(0, 30) + '...' : kpText,
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
    ]) as [any, EvaluationRecord[], any[]];

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
      const parsed = safeParseReport(r.report);
      const kpText = parsed.knowledgePoints?.slice(0, 3).join(';') || '无';
      return {
        name: r.student_name || '未知',
        class: r.student_class || '',
        title: (r.question?.length > 20 ? r.question.substring(0, 20) + '...' : r.question) || '无标题',
        score: r.score || 0,
        level: parsed.level || '待提升',
        kp: kpText.length > 30 ? kpText.substring(0, 30) + '...' : kpText,
        time: isValidDate ? date.toLocaleString('zh-CN') : '未知时间',
      };
    });

    // 四维度统计：从 report JSON 中提取 understandingScore 等，
    // 计算原始分平均值（不是百分比）。前端按 "understanding/30" 等方式展示。
    let totalUnderstanding = 0;
    let totalLogic = 0;
    let totalReadability = 0;
    let totalSyntax = 0;
    let validCount = 0;
    for (const r of records) {
      const parsed = safeParseReport(r.report);
      if (parsed.understanding || parsed.logic || parsed.readability || parsed.syntax) {
        totalUnderstanding += parsed.understanding;
        totalLogic += parsed.logic;
        totalReadability += parsed.readability;
        totalSyntax += parsed.syntax;
        validCount++;
      }
    }
    const dimensionStats = validCount > 0 ? {
      understanding: Math.round((totalUnderstanding / validCount) * 10) / 10,
      logic: Math.round((totalLogic / validCount) * 10) / 10,
      readability: Math.round((totalReadability / validCount) * 10) / 10,
      syntax: Math.round((totalSyntax / validCount) * 10) / 10,
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
