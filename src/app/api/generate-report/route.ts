import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

/**
 * 将简单的 Markdown 文本转换为 HTML（支持标题、多级列表、粗体、换行）
 * 处理规则：
 *   中文大标题（一、xxx）: <h3>
 *   小标题（xxx:）: <strong>
 *   一级有序列表（1. xxx）: <ol><li>，不因空行或子项中断
 *   二级无序列表（■ / - / * xxx）: 嵌套在 <ol> 内的 <ul><li>
 *   普通段落: <p>
 */
function markdownToHtml(text: string): string {
  if (!text) return '';
  
  let html = text.trim();
  
  // 先清理 markdown 分割线和孤立标记
  html = html.replace(/^\s*---+\s*$/gm, '');
  html = html.replace(/^\s*###+\s*$/gm, '');
  html = html.replace(/^\s*##+\s*$/gm, '');
  html = html.replace(/^\s*[-*]+\s*$/gm, '');
  
  // 粗体 **text** -> <strong>text</strong>
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong style="color: #111827;">$1</strong>');
  
  // 斜体 *text* -> <em>text</em>
  html = html.replace(/(^|[^\*])\*([^\*\n]+)\*/g, '$1<em>$2</em>');
  
  // Markdown 标题处理 (# / ## / ###)
  html = html.replace(/^### (.+)$/gm, '<h4 style="margin: 15px 0 10px; color: #1f2937; font-size: 16px;">$1</h4>');
  html = html.replace(/^## (.+)$/gm, '<h3 style="margin: 20px 0 12px; color: #1f2937; font-size: 18px;">$1</h3>');
  html = html.replace(/^# (.+)$/gm, '<h2 style="margin: 25px 0 15px; color: #1f2937; font-size: 20px;">$1</h2>');
  
  /**
   * 检测一行的语义类型
   */
  function detectLineType(line: string): { type: string; content: string } {
    const trimmed = line.trim();
    
    // 中文大标题: 一、xxx 二、xxx （中文数字 + 顿号开头）
    const chineseTitleMatch = trimmed.match(/^[一二三四五六七八九十]+、\s*(.+)$/);
    if (chineseTitleMatch && chineseTitleMatch[1].length > 2) {
      return { type: 'chinese_title', content: chineseTitleMatch[1] };
    }
    
    // 阿拉伯数字有序列表: 1. xxx 或 1、xxx
    const numberedMatch = trimmed.match(/^(\d+)[.、\)）]\s+(.+)$/);
    if (numberedMatch) {
      return { type: 'numbered', content: numberedMatch[2] };
    }
    
    // 项目符号列表: ■ ▪ ● ◆ □ ▲ ▶ ♦ ◆ - * + 等
    const bulletMatch = trimmed.match(/^[\s]*[\u25A0\u25AA\u25CF\u25C6\u25A1\u25B2\u25B6\u2666\-*+\u2022]\s*(.+)$/);
    if (bulletMatch) {
      return { type: 'bullet', content: bulletMatch[1] };
    }
    
    return { type: 'text', content: trimmed };
  }
  
  // 逐行处理，维护列表状态
  const lines2 = html.split('\n');
  const result: string[] = [];
  
  // 状态: olOpen = 一级ol是否打开, ulOpen = 二级ul是否打开
  let olOpen = false;
  let ulOpen = false;
  
  // 样式常量
  const h3Style = 'style="margin: 20px 0 12px; padding: 10px 15px; background: linear-gradient(to right, #fef3c7, #fef9e7); border-left: 4px solid #f59e0b; color: #1f2937; font-size: 17px; font-weight: 700; border-radius: 4px;"';
  const olStyle = 'style="margin: 15px 0; padding-left: 30px; line-height: 2; color: #374151;"';
  const ulStyle = 'style="margin: 8px 0 8px 10px; padding-left: 24px; line-height: 1.8; color: #4b5563;"';
  const liOlStyle = 'style="font-weight: 600; color: #1f2937; margin: 12px 0 8px;"';
  const liUlStyle = 'style="color: #4b5563; margin: 5px 0; font-weight: 400;"';
  const pStyle = 'style="line-height: 1.8; color: #374151; margin: 10px 0; text-indent: 0;"';
  
  // 小工具：关闭所有列表
  function closeAllLists() {
    if (ulOpen) {
      result.push('</ul>');
      ulOpen = false;
    }
    if (olOpen) {
      result.push('</ol>');
      olOpen = false;
    }
  }
  
  for (let i = 0; i < lines2.length; i++) {
    const line = lines2[i];
    const trimmed = line.trim();
    
    if (!trimmed) {
      // 空行: 只关闭二级 ul，不关闭一级 ol（避免数字序号重置为1）
      if (ulOpen) {
        result.push('</ul>');
        ulOpen = false;
      }
      continue;
    }
    
    const detected = detectLineType(line);
    
    if (detected.type === 'chinese_title') {
      closeAllLists();
      result.push('<h3 ' + h3Style + '>' + detected.content + '</h3>');
      
    } else if (detected.type === 'numbered') {
      if (ulOpen) {
        result.push('</ul>');
        ulOpen = false;
      }
      if (!olOpen) {
        result.push('<ol ' + olStyle + '>');
        olOpen = true;
      }
      result.push('<li ' + liOlStyle + '>' + detected.content + '</li>');
      
    } else if (detected.type === 'bullet') {
      if (!olOpen) {
        result.push('<ul ' + ulStyle + '>');
        ulOpen = true;
      } else {
        if (!ulOpen) {
          result.push('<ul ' + ulStyle + '>');
          ulOpen = true;
        }
      }
      result.push('<li ' + liUlStyle + '>' + detected.content + '</li>');
      
    } else {
      closeAllLists();
      result.push('<p ' + pStyle + '>' + detected.content + '</p>');
    }
  }
  
  closeAllLists();
  
  html = result.join('\n');
  html = html.replace(/\n{3,}/g, '\n\n');
  
  return html;
}


export async function POST(req: NextRequest) {
  try {
    const { evaluations, students, filters } = await req.json();
    const report = await generateReport(evaluations, students, filters);
    const blob = new Blob([report], { type: 'text/html' });
    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="report.html"; filename*=UTF-8''${encodeURIComponent('学情诊断报告.html')}`,
      },
    });
  } catch (error) {
    console.error('生成报告失败:', error);
    return NextResponse.json({ error: '生成报告失败' }, { status: 500 });
  }
}

async function generateReport(evaluations: any[], students: any[], filters: any) {
  const totalStudents = students.length;
  const totalEvaluations = evaluations.length;
  const avgScore = evaluations.length > 0 
    ? (evaluations.reduce((sum: number, e: any) => sum + e.score, 0) / evaluations.length).toFixed(1)
    : '0';

  const scoreDistribution = getScoreDistribution(evaluations);
  const classStats = getClassStats(evaluations, students);
  const topKnowledgePoints = getTopKnowledgePoints(evaluations, 10);
  const levelDistribution = getLevelDistribution(evaluations);
  const abilityStats = getAbilityStats(evaluations);
  
  const aiSuggestions = await generateAISuggestions({
    totalStudents,
    totalEvaluations,
    avgScore,
    scoreDistribution,
    classStats,
    topKnowledgePoints,
    levelDistribution,
    abilityStats,
    filters,
  });

  let html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>学情诊断报告</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: "Microsoft YaHei", "SimHei", sans-serif; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); min-height: 100vh; padding: 40px; }
.container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.1); overflow: hidden; }
.header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; }
.header h1 { font-size: 2.5em; margin-bottom: 10px; font-weight: 300; }
.header .meta { opacity: 0.9; font-size: 14px; }
.content { padding: 40px; }
.section { margin-bottom: 50px; }
.section-title { color: #1f2937; font-size: 1.4em; margin-bottom: 25px; padding-bottom: 12px; border-bottom: 3px solid #667eea; position: relative; }
.section-title::after { content: ''; position: absolute; bottom: -3px; left: 0; width: 60px; height: 3px; background: #764ba2; }
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
.stat-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 15px; padding: 25px; color: white; text-align: center; transition: transform 0.3s, box-shadow 0.3s; }
.stat-card:hover { transform: translateY(-5px); box-shadow: 0 15px 30px rgba(102,126,234,0.4); }
.stat-value { font-size: 2.5em; font-weight: bold; margin-bottom: 5px; }
.stat-label { opacity: 0.9; font-size: 14px; }
.stat-card.orange { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.stat-card.green { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
.stat-card.purple { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
table { width: 100%; border-collapse: collapse; margin: 20px 0; }
th, td { padding: 15px; text-align: left; border-bottom: 1px solid #e5e7eb; }
th { background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); font-weight: 600; color: #374151; }
tr:hover { background: #f9fafb; }
.chart-container { margin: 30px 0; }
.chart-title { font-size: 1.1em; color: #374151; margin-bottom: 20px; font-weight: 500; }
.bar-chart { display: flex; align-items: flex-end; height: 200px; gap: 15px; padding: 20px; background: #f9fafb; border-radius: 12px; }
.bar-wrapper { flex: 1; display: flex; flex-direction: column; align-items: center; }
.bar { width: 100%; max-width: 60px; border-radius: 8px 8px 0 0; transition: height 0.5s ease; position: relative; }
.bar::after { content: attr(data-value); position: absolute; top: -25px; left: 50%; transform: translateX(-50%); font-size: 12px; font-weight: 600; color: #374151; }
.bar-label { margin-top: 10px; font-size: 12px; color: #6b7280; text-align: center; }
.bar.high { background: linear-gradient(180deg, #10b981 0%, #059669 100%); }
.bar.medium { background: linear-gradient(180deg, #f59e0b 0%, #d97706 100%); }
.bar.low { background: linear-gradient(180deg, #ef4444 0%, #dc2626 100%); }
.bar.blue { background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%); }
.bar.purple { background: linear-gradient(180deg, #8b5cf6 0%, #7c3aed 100%); }
.bar.pink { background: linear-gradient(180deg, #ec4899 0%, #db2777 100%); }
.bar.cyan { background: linear-gradient(180deg, #06b6d4 0%, #0891b2 100%); }
.bar.orange { background: linear-gradient(180deg, #f97316 0%, #ea580c 100%); }
.bar.green { background: linear-gradient(180deg, #22c55e 0%, #16a34a 100%); }
.bar.red { background: linear-gradient(180deg, #ef4444 0%, #dc2626 100%); }
.pie-chart-container { display: flex; justify-content: center; align-items: center; gap: 40px; padding: 20px; }
.pie-chart { width: 200px; height: 200px; border-radius: 50%; position: relative; }
.pie-center { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 100px; height: 100px; background: white; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.pie-value { font-size: 1.5em; font-weight: bold; color: #374151; }
.pie-label { font-size: 12px; color: #6b7280; }
.pie-legend { display: flex; flex-direction: column; gap: 10px; }
.legend-item { display: flex; align-items: center; gap: 10px; }
.legend-color { width: 20px; height: 20px; border-radius: 4px; }
.legend-text { font-size: 14px; color: #374151; }
.radar-chart { width: 300px; height: 300px; margin: 0 auto; position: relative; }
.radar-bg { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); }
.radar-polygon { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); }
.radar-axis { position: absolute; top: 50%; left: 50%; width: 1px; height: 120px; background: #e5e7eb; transform-origin: bottom center; }
.radar-label { position: absolute; font-size: 12px; font-weight: 500; color: #374151; }
.tag { display: inline-block; padding: 5px 12px; border-radius: 20px; font-size: 12px; margin-right: 8px; margin-bottom: 8px; }
.tag.high { background: #fef2f2; color: #dc2626; }
.tag.medium { background: #fffbeb; color: #d97706; }
.tag.low { background: #ecfdf5; color: #059669; }
.recommendation { background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%); border-left: 4px solid #f59e0b; padding: 20px; border-radius: 0 10px 10px 0; margin: 20px 0; }
.recommendation h4 { color: #92400e; margin-bottom: 10px; }
.recommendation ul { margin-left: 20px; color: #78350f; }
.recommendation li { margin-bottom: 8px; }
.footer { background: #1f2937; color: #9ca3af; padding: 30px; text-align: center; font-size: 14px; }
.highlight { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 2px 8px; border-radius: 4px; font-weight: 600; color: #92400e; }
.progress-bar { height: 12px; background: #e5e7eb; border-radius: 6px; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 6px; transition: width 0.5s ease; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>📊 学情诊断报告</h1>
    <div class="meta">生成时间：${new Date().toLocaleString('zh-CN')} | 共 ${totalStudents} 名学生 | ${totalEvaluations} 条评价记录</div>
  </div>
  
  <div class="content">
    <div class="section">
      <h2 class="section-title">一、统计概览</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${totalEvaluations}</div>
          <div class="stat-label">评价记录总数</div>
        </div>
        <div class="stat-card orange">
          <div class="stat-value">${avgScore}</div>
          <div class="stat-label">平均成绩</div>
        </div>
        <div class="stat-card green">
          <div class="stat-value">${totalStudents}</div>
          <div class="stat-label">参与学生数</div>
        </div>
        <div class="stat-card purple">
          <div class="stat-value">${topKnowledgePoints.length}</div>
          <div class="stat-label">易错知识点数</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">二、筛选条件</h2>
      <table>
        <tr><th>筛选项</th><th>值</th></tr>
        <tr><td>学生姓名</td><td>${filters.studentName || '全部'}</td></tr>
        <tr><td>班级</td><td>${!filters.className || filters.className === '全部班级' || filters.className === '全部' ? '全部' : filters.className}</td></tr>
        <tr><td>分数范围</td><td>${filters.minScore || 0} - ${filters.maxScore || 100}</td></tr>
      </table>
    </div>

    <div class="section">
      <h2 class="section-title">三、成绩分布分析</h2>
      <div class="chart-container">
        <div class="chart-title">📈 成绩区间分布</div>
        <div class="bar-chart" style="height: 250px; display: flex; align-items: flex-end; gap: 15px; padding: 30px 20px 20px; background: #f9fafb; border-radius: 12px;">
          ${(() => {
            const colors = ['#ec4899', '#f97316', '#3b82f6', '#8b5cf6'];
            const maxCount = Math.max(...scoreDistribution.map((x: any) => x.count), 1);
            return scoreDistribution.map((item: any, idx: number) => {
              const heightPx = Math.max((item.count / maxCount) * 180, 8);
              return `<div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                <div style="position: relative; width: 100%; max-width: 80px; height: ${heightPx}px; background: linear-gradient(180deg, ${colors[idx % colors.length]} 0%, ${colors[idx % colors.length]}dd 100%); border-radius: 8px 8px 0 0; display: flex; justify-content: center;">
                  <div style="position: absolute; top: -22px; font-size: 13px; font-weight: 600; color: #374151;">${item.count}</div>
                </div>
                <div style="margin-top: 10px; font-size: 12px; color: #6b7280; text-align: center;">${item.range}</div>
              </div>`;
            }).join('');
          })()}
        </div>
      </div>

      <div class="chart-container">
        <div class="chart-title">📊 等级分布占比</div>
        <div class="pie-chart-container">
          <div class="pie-chart" style="background: conic-gradient(#10b981 ${levelDistribution.excellent.percent}%, #f59e0b ${levelDistribution.excellent.percent}% ${levelDistribution.excellent.percent + levelDistribution.good.percent}%, #ef4444 ${levelDistribution.excellent.percent + levelDistribution.good.percent}% 100%)">
            <div class="pie-center"><div class="pie-value">${avgScore}</div><div class="pie-label">平均分</div></div>
          </div>
          <div class="pie-legend">
            <div class="legend-item"><div class="legend-color" style="background:#10b981"></div><span class="legend-text">优秀 (≥80): ${levelDistribution.excellent.count}人</span></div>
            <div class="legend-item"><div class="legend-color" style="background:#f59e0b"></div><span class="legend-text">良好 (60-79): ${levelDistribution.good.count}人</span></div>
            <div class="legend-item"><div class="legend-color" style="background:#ef4444"></div><span class="legend-text">待提升 (<60): ${levelDistribution.needImprove.count}人</span></div>
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">四、班级成绩对比</h2>
      <div class="chart-container">
        <div class="chart-title">🏆 各班平均分对比</div>
        <div style="height: 250px; display: flex; align-items: flex-end; gap: 20px; padding: 30px 20px 20px; background: #f9fafb; border-radius: 12px;">
          ${(() => {
            const colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#22c55e', '#f97316', '#ec4899', '#ef4444'];
            const entries = Object.entries(classStats);
            return entries.map(([cls, stats]: [string, any], idx: number) => {
              const avg = parseFloat((stats as any).avg) || 0;
              const heightPx = Math.max((avg / 100) * 180, 8);
              return `<div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                <div style="position: relative; width: 100%; max-width: 80px; height: ${heightPx}px; background: linear-gradient(180deg, ${colors[idx % colors.length]} 0%, ${colors[idx % colors.length]}dd 100%); border-radius: 8px 8px 0 0;">
                  <div style="position: absolute; top: -22px; left: 50%; transform: translateX(-50%); font-size: 13px; font-weight: 600; color: #374151;">${avg.toFixed(1)}</div>
                </div>
                <div style="margin-top: 10px; font-size: 12px; color: #6b7280; text-align: center;">${cls}</div>
              </div>`;
            }).join('');
          })()}
        </div>
      </div>
      
      <table>
        <tr><th>班级</th><th>评价记录数</th><th>平均分</th><th>最高分</th><th>最低分</th></tr>
        ${Object.entries(classStats).map(([cls, stats]: [string, any]) => 
          `<tr><td>${cls}</td><td>${stats.count}</td><td><span class="highlight">${stats.avg}</span></td><td>${stats.max}</td><td>${stats.min}</td></tr>`
        ).join('')}
      </table>
    </div>

    <div class="section">
      <h2 class="section-title">五、易错知识点TOP 10</h2>
      <div class="chart-container">
        <div class="chart-title">⚠️ 高频易错知识点排行</div>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${topKnowledgePoints.map((item: any, idx: number) => {
            const maxCount = topKnowledgePoints[0]?.count || 1;
            const colors = ['red', 'orange', 'pink', 'purple', 'blue', 'cyan', 'green', 'pink', 'purple', 'blue'];
            return `
            <div style="display: flex; align-items: center; gap: 15px;">
              <span style="width: 25px; font-weight: bold; color: #6b7280;">${idx + 1}</span>
              <div style="flex: 1;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                  <span style="font-size: 14px; color: #374151;">${item.name.length > 30 ? item.name.slice(0, 30) + '...' : item.name}</span>
                  <span style="font-weight: 600; color: #667eea;">${item.count} 次</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill ${colors[idx % colors.length]}" style="width: ${(item.count / maxCount) * 100}%; background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);"></div>
                </div>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">六、能力维度分析</h2>
      <div class="chart-container">
        <div class="chart-title">🎯 四维度能力评估</div>
        <div class="stats-grid">
          ${Object.entries(abilityStats).map(([name, score]: [string, number]) => {
            const colorClass = score >= 80 ? 'green' : score >= 60 ? 'orange' : 'pink';
            return `<div class="stat-card ${colorClass}"><div class="stat-value">${score}%</div><div class="stat-label">${name}</div></div>`;
          }).join('')}
        </div>
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">七、学习建议</h2>
      <div class="recommendation">
        <h4>📌 AI智能分析建议</h4>
        ${markdownToHtml(aiSuggestions.suggestions)}
      </div>
      
      <div class="recommendation">
        <h4>📚 重点关注知识点</h4>
        <p style="margin-bottom: 10px; color: #78350f;">以下知识点出现频率较高，建议重点讲解：</p>
        ${topKnowledgePoints.slice(0, 5).map((item: any) => `<span class="tag high">${item.name.slice(0, 25)}...</span>`).join('')}
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">八、总结</h2>
      ${markdownToHtml(aiSuggestions.summary)}
    </div>
  </div>
  
  <div class="footer">
    <p>✨ 学情诊断报告</p>
    <p style="margin-top: 5px; font-size: 12px; opacity: 0.7;">Generated by 码上成长 — Python代码智能评价与学情诊断AI智能体</p>
  </div>
</div>
</body>
</html>`;

  return html;
}

function getScoreDistribution(evaluations: any[]) {
  const ranges = [
    { range: '80-100', min: 80, max: 101, count: 0 },
    { range: '60-79', min: 60, max: 80, count: 0 },
    { range: '40-59', min: 40, max: 60, count: 0 },
    { range: '0-39', min: 0, max: 40, count: 0 },
  ];
  
  evaluations.forEach(e => {
    const score = e.score;
    const range = ranges.find(r => score >= r.min && score < r.max);
    if (range) range.count++;
  });
  
  return ranges;
}

function getClassStats(evaluations: any[], students: any[]) {
  const stats: Record<string, { count: number; sum: number; max: number; min: number; avg?: string }> = {};
  
  evaluations.forEach(e => {
    const student = students.find((s: any) => s.studentId === e.studentId);
    const className = student?.class || '未知班级';
    if (!stats[className]) {
      stats[className] = { count: 0, sum: 0, max: 0, min: 100 };
    }
    stats[className].count++;
    stats[className].sum += e.score;
    stats[className].max = Math.max(stats[className].max, e.score);
    stats[className].min = Math.min(stats[className].min, e.score);
  });
  
  Object.keys(stats).forEach(cls => {
    stats[cls] = {
      ...stats[cls],
      avg: (stats[cls].sum / stats[cls].count).toFixed(1)
    };
  });
  
  return stats;
}

function getTopKnowledgePoints(evaluations: any[], limit: number) {
  const kpCount: Record<string, number> = {};
  
  evaluations.forEach(e => {
    try {
      const report = typeof e.report === 'string' ? JSON.parse(e.report) : e.report;
      if (report?.knowledgePoints && Array.isArray(report.knowledgePoints)) {
        report.knowledgePoints.forEach((kp: string) => {
          kpCount[kp] = (kpCount[kp] || 0) + 1;
        });
      }
    } catch {}
  });
  
  return Object.entries(kpCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function getLevelDistribution(evaluations: any[]) {
  const distribution = {
    excellent: { count: 0, percent: 0 },
    good: { count: 0, percent: 0 },
    needImprove: { count: 0, percent: 0 },
  };
  
  evaluations.forEach(e => {
    if (e.score >= 80) distribution.excellent.count++;
    else if (e.score >= 60) distribution.good.count++;
    else distribution.needImprove.count++;
  });
  
  const total = evaluations.length || 1;
  distribution.excellent.percent = (distribution.excellent.count / total) * 100;
  distribution.good.percent = (distribution.good.count / total) * 100;
  distribution.needImprove.percent = (distribution.needImprove.count / total) * 100;
  
  return distribution;
}

/**
 * 从评价记录中提取四个维度的平均得分（转换为百分比）
 */
function getAbilityStats(evaluations: any[]) {
  let totalUnderstanding = 0;
  let totalLogic = 0;
  let totalReadability = 0;
  let totalSyntax = 0;
  let count = 0;

  for (const e of evaluations) {
    let understanding = 0;
    let logic = 0;
    let readability = 0;
    let syntax = 0;

    // 先尝试从独立字段读取（如果有）
    if (e.understanding_score) {
      understanding = parseFloat(e.understanding_score) || 0;
      logic = parseFloat(e.logic_score) || 0;
      readability = parseFloat(e.readability_score) || 0;
      syntax = parseFloat(e.syntax_score) || 0;
    }

    // 如果独立字段没有值，从 report JSON 中读取
    if ((!understanding || !logic || !readability || !syntax) && e.report) {
      try {
        const report = typeof e.report === 'string' ? JSON.parse(e.report) : e.report;

        // 数据库实际存储格式：驼峰命名单字段
        if (typeof report.understandingScore === 'number') {
          understanding = report.understandingScore || 0;
          logic = report.logicScore || 0;
          readability = report.readabilityScore || 0;
          syntax = report.syntaxScore || 0;
        } else if (typeof report.understanding_score === 'number') {
          // 下划线格式兜底
          understanding = report.understanding_score || 0;
          logic = report.logic_score || 0;
          readability = report.readability_score || 0;
          syntax = report.syntax_score || 0;
        } else if (Array.isArray(report.dimensions)) {
          // dimensions 数组格式（仅存在于 evaluate API 返回值，数据库中没有）
          for (const dim of report.dimensions) {
            if (dim && dim.key) {
              const s = parseFloat(dim.score);
              if (!isNaN(s)) {
                if (dim.key === 'understanding') understanding = s;
                else if (dim.key === 'logic') logic = s;
                else if (dim.key === 'readability') readability = s;
                else if (dim.key === 'syntax') syntax = s;
              }
            }
          }
        }
      } catch {
        // 解析失败，跳过此条
      }
    }

    // 累加有效数据
    if (understanding > 0) totalUnderstanding += understanding;
    if (logic > 0) totalLogic += logic;
    if (readability > 0) totalReadability += readability;
    if (syntax > 0) totalSyntax += syntax;
    if (understanding > 0 || logic > 0 || readability > 0 || syntax > 0) count++;
  }

  if (count === 0) {
    return { '题目理解与实现': 0, '逻辑思路': 0, '代码可读性': 0, '语法掌握': 0 };
  }

  // 各维度满分：理解30 / 逻辑25 / 可读25 / 语法20
  const maxScores = { '题目理解与实现': 30, '逻辑思路': 25, '代码可读性': 25, '语法掌握': 20 };
  const avgUnderstanding = totalUnderstanding / count;
  const avgLogic = totalLogic / count;
  const avgReadability = totalReadability / count;
  const avgSyntax = totalSyntax / count;

  return {
    '题目理解与实现': Math.round((avgUnderstanding / maxScores['题目理解与实现']) * 100),
    '逻辑思路': Math.round((avgLogic / maxScores['逻辑思路']) * 100),
    '代码可读性': Math.round((avgReadability / maxScores['代码可读性']) * 100),
    '语法掌握': Math.round((avgSyntax / maxScores['语法掌握']) * 100),
  };
}

/**
 * 从 AI 生成的文本中解析出「建议」和「总结」两部分
 * 使用多种策略解析，提高对不同格式的鲁棒性
 */
function parseAIContent(content: string, data: any): { suggestions: string; summary: string } {
  if (!content) {
    return buildFallback(data);
  }

  const raw = content.trim();

  // —— 策略 1: 强匹配「1. xxx / 2. xxx」中文标题格式
  const numberedTitleRe = /[一二三四五六七八九十\d]+[.、\)）]\s*(教学改进建议|教学建议|建议)[\s\S]*?(?=[一二三四五六七八九十\d]+[.、\)）]\s*(总结报告|总结|分析总结)|$)/;
  const summaryTitleRe = /[一二三四五六七八九十\d]+[.、\)）]\s*(总结报告|总结|分析总结)[\s\S]*$/;

  const m1 = raw.match(numberedTitleRe);
  const m2 = raw.match(summaryTitleRe);

  if (m1 && m2) {
    const suggestions = m1[0].replace(/^[一二三四五六七八九十\d]+[.、\)）]\s*(教学改进建议|教学建议|建议)\s*/, '').trim();
    const summary = m2[0].replace(/^[一二三四五六七八九十\d]+[.、\)）]\s*(总结报告|总结|分析总结)\s*/, '').trim();
    if (suggestions && summary) {
      return { suggestions, summary };
    }
  }

  // —— 策略 2: 按段落切分并搜索「建议/总结」关键词作为段落锚点
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
  let sugStartIdx = -1;
  let sumStartIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (sugStartIdx === -1 && /建议|教学改进/.test(line) && line.length < 40) {
      sugStartIdx = i;
    }
    if (sumStartIdx === -1 && /总结|报告/.test(line) && line.length < 40) {
      sumStartIdx = i;
    }
  }

  if (sugStartIdx !== -1 && sumStartIdx !== -1 && sumStartIdx > sugStartIdx) {
    const suggestions = lines.slice(sugStartIdx + 1, sumStartIdx).join('\n').trim();
    const summary = lines.slice(sumStartIdx + 1).join('\n').trim();
    if (suggestions && summary) {
      return { suggestions, summary };
    }
  }

  // —— 策略 3: 用段落切分 + 关键字启发式推断
  const paragraphs = raw.split(/\n{2,}/).map((p) => p.trim()).filter((p) => p.length > 10);

  if (paragraphs.length >= 2) {
    const scored = paragraphs.map((p) => {
      const sugMatches = (p.match(/建议|改进|教学|讲解|练习|辅导|加强|增加|提升/g) || []).length;
      const sumMatches = (p.match(/总结|报告|整体|综上|概括|诊断|分析/g) || []).length;
      return { p, sug: sugMatches, sum: sumMatches };
    });

    const sortedBySug = [...scored].sort((a, b) => b.sug - a.sug);
    const sortedBySum = [...scored].sort((a, b) => b.sum - a.sug);

    const bestSug = sortedBySug[0]?.p || paragraphs[0];
    const bestSum = sortedBySum[0]?.p || paragraphs[paragraphs.length - 1];

    if (bestSug && bestSum && bestSug !== bestSum) {
      return { suggestions: bestSug, summary: bestSum };
    }
  }

  // —— 策略 4: 对半切分（前半为建议，后半为总结）
  const half = Math.floor(raw.length / 2);
  const firstHalfRaw = raw.slice(0, half);
  const secondHalfRaw = raw.slice(half);
  const firstHalf = firstHalfRaw.slice(0, firstHalfRaw.lastIndexOf('\n')).trim() || firstHalfRaw.trim();
  const secondHalf = (secondHalfRaw.slice(secondHalfRaw.indexOf('\n')).trim() || secondHalfRaw.trim());

  if (firstHalf.length > 40 && secondHalf.length > 40) {
    return { suggestions: firstHalf, summary: secondHalf };
  }

  // —— 策略 5: 把整段内容同时作为两者的 fallback（至少保留 AI 的完整输出）
  return {
    suggestions: raw || buildFallback(data).suggestions,
    summary: buildFallback(data).summary,
  };
}

/**
 * 当无法获得 AI 响应时，构造一份数据驱动的中文兜底文本
 */
function buildFallback(data: any): { suggestions: string; summary: string } {
  const topKps = (data.topKnowledgePoints || []).slice(0, 5);
  const kpText = topKps.length > 0
    ? topKps.map((k: any) => `${k.name}（${k.count}次）`).join('、')
    : '暂无高频易错知识点';

  const performanceLevel =
    parseFloat(data.avgScore) >= 80 ? '优秀' :
    parseFloat(data.avgScore) >= 60 ? '良好' : '有待提升';

  const suggestions = `【教学改进建议】\n根据学生学情分析，全体学生平均成绩为 ${data.avgScore} 分，整体表现${performanceLevel}。以下是针对教学过程的具体改进建议：\n一、针对高频易错知识点加强讲解：识别到的易错知识点包括：${kpText}。建议在课堂上安排针对性的专题讲解，并配套专项练习题，帮助学生攻克难点。\n二、分层教学：对于成绩较低的学生，建议安排一对一辅导或小组互助学习；对于学有余力的学生，可以布置拓展练习。\n三、增加编程实践机会：Python学习需要大量动手练习，建议每周安排不少于2次实操课，通过实际项目加深对知识点的理解。\n四、培养调试能力：鼓励学生自己阅读错误信息，培养独立调试代码的能力。\n五、及时反馈评价：每次作业后及时给出详细的代码评价与改进建议，让学生清楚自己的问题所在。`;

  const summary = `【总结】本次学情诊断报告基于 ${data.totalEvaluations} 条评价记录生成，覆盖 ${data.totalStudents} 名学生。全体学生平均成绩为 ${data.avgScore} 分，整体表现${performanceLevel}。分析显示共有 ${data.topKnowledgePoints?.length || 0} 个易错知识点被识别，为后续教学提供了明确的改进方向。建议结合能力维度数据，对表现较弱的维度进行针对性训练，并持续跟踪学生进步情况。`;

  return { suggestions, summary };
}

/**
 * 调用 DeepSeek 大模型生成学情分析建议与总结
 * 优先使用自定义分隔标记解析，并搭配多策略文本解析作为兜底
 */
async function generateAISuggestions(data: any) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const apiBase = process.env.DEEPSEEK_API_BASE || 'https://api.deepseek.com/v1';

  if (!apiKey) {
    return buildFallback(data);
  }

  const client = new OpenAI({ apiKey, baseURL: apiBase });

  const kpText = (data.topKnowledgePoints || []).slice(0, 5)
    .map((item: any, idx: number) => `${idx + 1}. ${item.name}（出现${item.count}次）`)
    .join('\n');

  const abilityText = Object.entries(data.abilityStats || {})
    .map(([name, score]: [string, any]) => `${name}：${score}%`)
    .join('；');

  const scoreDistText = (data.scoreDistribution || [])
    .map((item: any) => `${item.range}分：${item.count}人`)
    .join('；');

  const prompt = `你是一名资深的Python编程教育专家，请根据以下学情数据分析，生成专业、详细的教学建议和总结。

【数据概览】
- 评价记录数：${data.totalEvaluations} 条
- 学生人数：${data.totalStudents} 人
- 平均成绩：${data.avgScore} 分

【成绩分布】
${scoreDistText}

【等级分布】
- 优秀（>=80分）：${data.levelDistribution.excellent.count}人（${data.levelDistribution.excellent.percent}%）
- 良好（60-79分）：${data.levelDistribution.good.count}人（${data.levelDistribution.good.percent}%）
- 待提升（<60分）：${data.levelDistribution.needImprove.count}人（${data.levelDistribution.needImprove.percent}%）

【能力维度分析】
${abilityText}

【高频易错知识点TOP 5】
${kpText}

【筛选条件】
- 学生姓名：${data.filters?.studentName || '全部'}
- 班级：${data.filters?.className || '全部'}
- 分数范围：${data.filters?.minScore || 0} - ${data.filters?.maxScore || 100}

请务必按以下"严格分隔格式"输出（两个部分之间使用 ===SUGGESTIONS_START=== 与 ===SUMMARY_START=== 作为分隔标记，不要省略或替换）：

===SUGGESTIONS_START===
【教学改进建议】
1. 针对能力短板的具体教学方法（结合上述四个能力维度）
2. 针对高频易错知识点的讲解与练习安排
3. 分层教学策略（优秀生/中等生/待提升生的差异化方案）
4. 教学节奏与作业量调整建议
要求：约300字，语言专业但易懂，建议要具体可操作
===SUGGESTIONS_END===

===SUMMARY_START===
【总结报告】
1. 学情整体评价（优秀/良好/有待提升）
2. 核心发现（最突出的3个问题）
3. 下一步教学改进的优先级
要求：约200字，突出重点问题和解决方案
===SUMMARY_END===`.trim();

  try {
    const response = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: '你是一名资深的Python编程教育专家，擅长分析学情数据并给出专业的教学建议。请严格按照用户要求的标记格式输出，使用中文回复。' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.6,
      max_tokens: 2500,
    });

    const content = response.choices[0]?.message?.content || '';
    console.log('[AI Report] raw content length:', content.length);

    // 策略 A：优先使用自定义分隔标记解析
    const sugMatch = content.match(/===SUGGESTIONS_START===\s*([\s\S]*?)\s*===SUGGESTIONS_END===/);
    const sumMatch = content.match(/===SUMMARY_START===\s*([\s\S]*?)\s*===SUMMARY_END===/);

    if (sugMatch && sumMatch && sugMatch[1].trim().length > 20 && sumMatch[1].trim().length > 20) {
      return {
        suggestions: sugMatch[1].trim(),
        summary: sumMatch[1].trim(),
      };
    }

    // 策略 B：退回到多策略文本解析
    const parsed = parseAIContent(content, data);
    if (parsed.suggestions && parsed.suggestions.length > 30) {
      return parsed;
    }

    // 策略 C：最终 fallback
    return buildFallback(data);
  } catch (error) {
    console.error('AI生成建议失败:', error);
    return buildFallback(data);
  }
}
