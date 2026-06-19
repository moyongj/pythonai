'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Activity,
  Trophy,
  Star,
  Lightbulb,
  BarChart3,
  TrendingUp,
  Code,
  Quote,
  Sparkles,
  FileText,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Search,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateSession, getStudentEvaluations, getStudents, type Student, type EvaluationRecord } from '@/lib/auth';
import { ProtectedLayout } from '@/components/protected-layout';

/**
 * 统计摘要接口
 */
interface Summary {
  totalCount: number;
  avgScore: number;
  excellentRate: number;
  kpCount: number;
}

/**
 * 分数分布项接口
 */
interface DistributionItem {
  range: string;
  count: number;
  color: string;
  text: string;
}

/**
 * 知识点统计项接口
 */
interface TopKpItem {
  name: string;
  count: number;
  percent: number;
}

/**
 * 最近记录接口
 */
interface RecentRecord {
  id: number;
  name: string;
  title: string;
  score: number;
  level: string;
  kp: string;
  time: string;
}

/**
 * 维度统计接口
 */
interface DimensionStats {
  understanding: number;
  logic: number;
  readability: number;
  syntax: number;
}

/**
 * 分页信息接口
 */
interface Pagination {
  page: number;
  limit: number;
  totalPages: number;
  totalRecords: number;
}

/**
 * 统计数据接口
 */
interface StatisticsData {
  summary: Summary;
  distribution: DistributionItem[];
  topKp: TopKpItem[];
  recentRecords: RecentRecord[];
  dimensionStats: DimensionStats;
  pagination: Pagination;
}

/**
 * 知识点词云数据
 */
const WORDCLOUD = [
  { text: 'if 判断', size: 'text-2xl', weight: 'font-extrabold', color: 'text-primary' },
  { text: 'for 循环', size: 'text-xl', weight: 'font-bold', color: 'text-accent-pink' },
  { text: 'while 循环', size: 'text-lg', weight: 'font-bold', color: 'text-accent-green' },
  { text: '变量命名', size: 'text-2xl', weight: 'font-extrabold', color: 'text-amber-700' },
  { text: '缩进', size: 'text-base', weight: 'font-semibold', color: 'text-primary' },
  { text: 'print', size: 'text-lg', weight: 'font-bold', color: 'text-accent-pink' },
  { text: 'input', size: 'text-base', weight: 'font-semibold', color: 'text-accent-green' },
  { text: '列表', size: 'text-xl', weight: 'font-bold', color: 'text-primary' },
  { text: '字典', size: 'text-base', weight: 'font-semibold', color: 'text-amber-700' },
  { text: '函数定义', size: 'text-lg', weight: 'font-bold', color: 'text-accent-pink' },
  { text: '返回值', size: 'text-base', weight: 'font-semibold', color: 'text-primary' },
  { text: '字符串', size: 'text-xl', weight: 'font-bold', color: 'text-accent-green' },
  { text: '类型转换', size: 'text-base', weight: 'font-semibold', color: 'text-amber-700' },
  { text: '比较运算', size: 'text-lg', weight: 'font-bold', color: 'text-accent-pink' },
  { text: '逻辑运算', size: 'text-base', weight: 'font-semibold', color: 'text-primary' },
];

/**
 * 根据等级获取徽章样式
 * 
 * @param {string} level - 等级：优秀、良好、及格、待提升
 * @returns {string} Tailwind CSS样式类
 */
function levelBadgeClass(level: string): string {
  if (level === '优秀') return 'bg-accent-green/15 text-accent-green';
  if (level === '良好') return 'bg-primary/15 text-primary';
  if (level === '及格') return 'bg-accent-yellow/20 text-amber-700';
  return 'bg-destructive/15 text-destructive';
}

/**
 * 环形进度条组件
 */
function RingProgress({
  percent,
  color,
  label,
  value,
}: {
  percent: number;
  color: string;
  label: string;
  value: string;
}) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const dash = (percent / 100) * circumference;
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative h-24 w-24">
        <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} stroke="currentColor" strokeWidth="8" fill="none" className="text-muted" />
          <circle cx="50" cy="50" r={radius} stroke={color} strokeWidth="8" strokeLinecap="round" fill="none" strokeDasharray={circumference} strokeDashoffset={circumference - dash} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-foreground">{percent.toFixed(1)}%</span>
        </div>
      </div>
      <div className="mt-2 text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-bold text-foreground">{value}</div>
    </div>
  );
}

/**
 * 分页组件
 */
function PaginationComponent({ pagination, onPageChange }: { pagination: Pagination; onPageChange: (page: number) => void }) {
  const { page, totalPages } = pagination;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-1 py-4">
      <button
        onClick={() => onPageChange(1)}
        disabled={page === 1}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-md border text-sm font-medium transition-colors',
          page === 1
            ? 'border-muted text-muted-foreground cursor-not-allowed'
            : 'border-border text-foreground hover:bg-muted'
        )}
      >
        <ChevronsLeft className="h-4 w-4" />
      </button>
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-md border text-sm font-medium transition-colors',
          page === 1
            ? 'border-muted text-muted-foreground cursor-not-allowed'
            : 'border-border text-foreground hover:bg-muted'
        )}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {getPageNumbers().map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors',
            page === p
              ? 'bg-primary text-primary-foreground'
              : 'border border-border text-foreground hover:bg-muted'
          )}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-md border text-sm font-medium transition-colors',
          page === totalPages
            ? 'border-muted text-muted-foreground cursor-not-allowed'
            : 'border-border text-foreground hover:bg-muted'
        )}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={page === totalPages}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-md border text-sm font-medium transition-colors',
          page === totalPages
            ? 'border-muted text-muted-foreground cursor-not-allowed'
            : 'border-border text-foreground hover:bg-muted'
        )}
      >
        <ChevronsRight className="h-4 w-4" />
      </button>
      <span className="ml-2 text-sm text-muted-foreground">
        第 {page} / {totalPages} 页，共 {pagination.totalRecords} 条记录
      </span>
    </div>
  );
}

/**
 * 解析报告字符串
 */
function parseReport(reportStr: string) {
  try {
    return JSON.parse(reportStr);
  } catch {
    try {
      const jsonStr = reportStr.replace(/'/g, '"').replace(/"(\w+)":/g, '"$1":');
      return JSON.parse(jsonStr);
    } catch {
      return null;
    }
  }
}

/**
 * 根据学情记录和学生数据生成统计数据
 */
function generateMockData(evaluations: EvaluationRecord[], students: Student[]): StatisticsData {
  const scores = evaluations.map(e => e.score);
  const totalCount = evaluations.length;
  const avgScore = totalCount > 0 ? scores.reduce((a, b) => a + b, 0) / totalCount : 0;
  const excellentCount = scores.filter(s => s >= 85).length;
  const excellentRate = totalCount > 0 ? (excellentCount / totalCount) * 100 : 0;

  const distribution = [
    { range: '85-100', count: scores.filter(s => s >= 85).length, color: 'bg-accent-pink', text: 'text-accent-pink' },
    { range: '70-84', count: scores.filter(s => s >= 70 && s < 85).length, color: 'bg-accent-green', text: 'text-accent-green' },
    { range: '60-69', count: scores.filter(s => s >= 60 && s < 70).length, color: 'bg-primary', text: 'text-primary' },
    { range: '0-59', count: scores.filter(s => s < 60).length, color: 'bg-destructive', text: 'text-destructive' },
  ];

  const kpCounts: Record<string, number> = {};
  const kpCategories: Record<string, { subItems: { name: string; count: number }[]; totalCount: number }> = {};
  let totalKpCount = 0;

  evaluations.forEach(e => {
    const report = parseReport(e.report);
    if (report && report.knowledgePoints && Array.isArray(report.knowledgePoints)) {
      report.knowledgePoints.forEach((kp: string) => {
        kpCounts[kp] = (kpCounts[kp] || 0) + 1;
        totalKpCount++;
        
        const parts = kp.split(' — ');
        if (parts.length >= 2) {
          const category = parts[0].trim();
          const subItem = parts.slice(1).join(' — ').trim();
          if (!kpCategories[category]) {
            kpCategories[category] = { subItems: [], totalCount: 0 };
          }
          const existingSubItem = kpCategories[category].subItems.find(s => s.name === subItem);
          if (existingSubItem) {
            existingSubItem.count++;
          } else {
            kpCategories[category].subItems.push({ name: subItem, count: 1 });
          }
          kpCategories[category].totalCount++;
        } else {
          const category = kp;
          if (!kpCategories[category]) {
            kpCategories[category] = { subItems: [], totalCount: 0 };
          }
          kpCategories[category].totalCount++;
        }
      });
    }
  });

  const topKp: TopKpItem[] = Object.entries(kpCategories)
    .map(([category, data]) => {
      const sortedSubItems = data.subItems.sort((a, b) => b.count - a.count);
      let name: string;
      if (sortedSubItems.length > 0) {
        const firstLineItems = sortedSubItems.slice(0, 2);
        const secondLineItems = sortedSubItems.slice(2, 4);
        let subItemsText = firstLineItems.map(s => s.name).join('、');
        if (secondLineItems.length > 0) {
          subItemsText += '\n' + secondLineItems.map(s => s.name).join('、');
          if (sortedSubItems.length > 4) {
            subItemsText += `等${sortedSubItems.length}项`;
          }
        }
        name = `${category}——${subItemsText}`;
      } else {
        name = category;
      }
      return {
        name,
        count: data.totalCount,
        percent: totalKpCount > 0 ? Math.round((data.totalCount / totalKpCount) * 100) : 0,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const recentRecords: RecentRecord[] = evaluations.slice(0, 10).map(e => {
    const student = students.find(s => s.studentId === e.studentId);
    const level = e.score >= 85 ? '优秀' : e.score >= 70 ? '良好' : e.score >= 60 ? '及格' : '待提升';
    const report = parseReport(e.report);
    const kps = report && report.knowledgePoints && Array.isArray(report.knowledgePoints) 
      ? report.knowledgePoints 
      : [];
    const kpText = kps.length > 0 ? kps.join('; ') : '无';
    return {
      id: e.id,
      name: student?.name || '未知学生',
      title: e.question.substring(0, 30) + (e.question.length > 30 ? '...' : ''),
      score: e.score,
      level,
      kp: kpText.length > 20 ? kpText.substring(0, 20) + '...' : kpText,
      time: new Date(e.createdAt).toLocaleString(),
    };
  });

  let understandingSum = 0, logicSum = 0, readabilitySum = 0, syntaxSum = 0;
  let validReports = 0;
  evaluations.forEach(e => {
    const report = parseReport(e.report);
    if (report && typeof report.understandingScore === 'number') {
      understandingSum += report.understandingScore;
      logicSum += report.logicScore || 0;
      readabilitySum += report.readabilityScore || 0;
      syntaxSum += report.syntaxScore || 0;
      validReports++;
    }
  });

  return {
    summary: {
      totalCount,
      avgScore: parseFloat(avgScore.toFixed(1)),
      excellentRate: parseFloat(excellentRate.toFixed(1)),
      kpCount: totalKpCount || 112,
    },
    distribution,
    topKp: topKp.length > 0 ? topKp : [
      { name: '字典 — 创建字典大括号{}书写错误', count: 0, percent: 0 },
      { name: 'for 循环 — 遍历列表/字符串', count: 0, percent: 0 },
      { name: '字符串 — 切片起始/结束索引设置错误', count: 0, percent: 0 },
      { name: '元组 — 单元素元组末尾缺失逗号', count: 0, percent: 0 },
      { name: '列表 — insert() 指定位置插入', count: 0, percent: 0 },
    ],
    recentRecords,
    dimensionStats: {
      understanding: validReports > 0 ? parseFloat((understandingSum / validReports).toFixed(1)) : 25,
      logic: validReports > 0 ? parseFloat((logicSum / validReports).toFixed(1)) : 21,
      readability: validReports > 0 ? parseFloat((readabilitySum / validReports).toFixed(1)) : 20,
      syntax: validReports > 0 ? parseFloat((syntaxSum / validReports).toFixed(1)) : 16,
    },
    pagination: {
      page: 1,
      limit: 10,
      totalPages: Math.ceil(totalCount / 10),
      totalRecords: totalCount,
    },
  };
}

/**
 * 学情统计页面
 * 
 * 展示学生的学习数据统计和分析，包含：
 * - 统计摘要卡片（总评价次数、平均分、优秀率、易错知识点）
 * - 成绩分布柱状图
 * - 四维度得分环形图
 * - 知识点词云
 * - 评价记录历史（分页展示）
 * - 数据导出功能（CSV格式）
 * 
 * @page
 * @author 码上成长项目组
 * @version 1.0.0
 */
export default function StatisticsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ type: 'student'; user: Student } | null>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StatisticsData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showSearch, setShowSearch] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    studentName: '',
    minScore: '',
    maxScore: '',
  });
  const [students, setStudents] = useState<Student[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluationRecord[]>([]);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportProgress, setReportProgress] = useState(0);

  /**
   * 一键生成学情诊断报告（带平滑进度条动画）
   */
  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    setReportProgress(0);

    let currentProgress = 0;
    let stopAnimation = false;

    /**
     * 平滑动画：每80ms增长，直到达到目标值，进度为整数
     */
    const animateTo = (target: number, speed: number = 2) => {
      return new Promise<void>((resolve) => {
        const timer = setInterval(() => {
          if (stopAnimation) {
            clearInterval(timer);
            resolve();
            return;
          }
          currentProgress = Math.min(Math.round(currentProgress + speed), target);
          setReportProgress(currentProgress);
          if (currentProgress >= target) {
            clearInterval(timer);
            resolve();
          }
        }, 80);
      });
    };

    try {
      // 阶段1: 准备请求 (0 -> 25%)
      await animateTo(25, 2);

      // 阶段2: 发起API请求
      const fetchPromise = fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evaluations,
          students,
          filters: searchFilters,
        })
      });

      // 并行：等待请求响应的同时，进度条缓慢增长到 70%
      const [response] = await Promise.all([
        fetchPromise,
        animateTo(70, 1)
      ]);

      if (!response.ok) {
        throw new Error('生成报告失败');
      }

      // 阶段3: 处理响应数据 (70 -> 90%)
      const blobPromise = response.blob();
      await Promise.all([
        blobPromise,
        animateTo(90, 2)
      ]);

      const blob = await blobPromise;

      // 阶段4: 触发下载 (90 -> 100%)
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `My_Learning_Report_${new Date().toISOString().slice(0, 10)}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      await animateTo(100, 3);
      toast.success('学情诊断报告生成成功！');
    } catch (error) {
      console.error('生成报告失败:', error);
      toast.error('生成报告失败，请稍后重试');
    } finally {
      stopAnimation = true;
      setTimeout(() => {
        setGeneratingReport(false);
        setReportProgress(0);
      }, 1000);
    }
  };

  /**
   * 页面初始化时验证session并加载数据
   */
  useEffect(() => {
    const initPage = async () => {
      const result = await validateSession();
      if (!result.success) {
        router.push('/login');
        return;
      }
      
      if (result.userType === 'admin') {
        router.push('/admin');
        return;
      }
      
      if (result.user && result.userType === 'student') {
        const student = result.user as Student;
        setCurrentUser({ type: 'student', user: student });
        
        const [evals, studentsData] = await Promise.all([
          getStudentEvaluations(student.studentId),
          getStudents(),
        ]);
        setEvaluations(evals);
        setStudents(studentsData);
        setData(generateMockData(evals, studentsData));
      }
      setLoading(false);
    };
    initPage();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser || !data) {
    return null;
  }

  const maxCount = Math.max(...data.distribution.map((d) => d.count), 1);

  const DIMENSIONS = [
    { name: '题目理解与实现', score: data.dimensionStats.understanding, full: 30, ring: '#FFD166' },
    { name: '逻辑思路', score: data.dimensionStats.logic, full: 25, ring: '#55C59D' },
    { name: '代码可读性', score: data.dimensionStats.readability, full: 25, ring: '#5B6CFF' },
    { name: '语法掌握', score: data.dimensionStats.syntax, full: 20, ring: '#FF7AB6' },
  ];

  const SUMMARY = [
    { label: '总评价次数', value: data.summary.totalCount.toString(), suffix: '次', icon: Activity, bg: 'bg-primary/10', text: 'text-primary' },
    { label: '平均分', value: data.summary.avgScore.toString(), suffix: '分', icon: Trophy, bg: 'bg-accent-yellow/15', text: 'text-amber-700' },
    { label: '优秀率', value: data.summary.excellentRate.toString(), suffix: '%', icon: Star, bg: 'bg-accent-green/15', text: 'text-accent-green' },
    { label: '易错知识点', value: data.summary.kpCount.toString(), suffix: '个', icon: Lightbulb, bg: 'bg-accent-pink/15', text: 'text-accent-pink' },
  ];

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-foreground sm:text-xl md:text-2xl">我的学情统计</h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            {currentUser.user.name}（{currentUser.user.class}）的学习数据分析
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={cn(
              'flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:px-4 sm:text-sm',
              showSearch
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground hover:bg-primary/10'
            )}
          >
            <Search className="h-3.5 w-3.5" />
            {showSearch ? '隐藏搜索' : '搜索筛选'}
          </button>
          <button
            onClick={() => handleGenerateReport()}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-float transition-all hover:opacity-90 sm:px-4 sm:text-sm"
          >
            <FileText className="h-3.5 w-3.5" />
            一键生成学情诊断报告
          </button>
          <button
            onClick={() => {
              const csv = [['学生姓名', '题目', '总分', '等级', '评价时间']]
                .concat(data.recentRecords.map(r => [r.name, r.title, r.score.toString(), r.level, r.time]))
                .map(row => row.join(',')).join('\n');
              const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
              const link = document.createElement('a');
              link.href = URL.createObjectURL(blob);
              link.download = '我的学情记录.csv';
              link.click();
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent-green px-3 py-2 text-xs font-semibold text-white shadow-float transition-all hover:opacity-90 sm:px-4 sm:text-sm"
          >
            <Download className="h-3.5 w-3.5" />
            导出记录
          </button>
        </div>
      </div>

      {showSearch && (
        <div className="rounded-xl bg-card p-4 shadow-card sm:p-5">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground sm:text-base">
            <Search className="h-3.5 w-3.5 text-primary sm:h-4 sm:w-4" />
            搜索筛选
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground sm:text-sm">学生姓名</label>
              <select
                value={searchFilters.studentName}
                onChange={(e) => setSearchFilters({ ...searchFilters, studentName: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 sm:px-3 sm:py-2 sm:text-sm"
              >
                <option value="">{currentUser.user.name}</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground sm:text-sm">最低分数</label>
              <input
                type="number"
                min="0"
                max="100"
                value={searchFilters.minScore}
                onChange={(e) => setSearchFilters({ ...searchFilters, minScore: e.target.value })}
                placeholder="0"
                className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 sm:px-3 sm:py-2 sm:text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground sm:text-sm">最高分数</label>
              <input
                type="number"
                min="0"
                max="100"
                value={searchFilters.maxScore}
                onChange={(e) => setSearchFilters({ ...searchFilters, maxScore: e.target.value })}
                placeholder="100"
                className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 sm:px-3 sm:py-2 sm:text-sm"
              />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 sm:mt-4">
            <button
              onClick={() => {
                let filtered = evaluations;
                if (searchFilters.minScore) filtered = filtered.filter(e => e.score >= parseInt(searchFilters.minScore));
                if (searchFilters.maxScore) filtered = filtered.filter(e => e.score <= parseInt(searchFilters.maxScore));
                setData(generateMockData(filtered, students));
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-float transition-all hover:opacity-90 sm:px-4 sm:py-2 sm:text-sm"
            >
              <Search className="h-3.5 w-3.5" />
              搜索
            </button>
            <button
              onClick={() => {
                setSearchFilters({ studentName: '', minScore: '', maxScore: '' });
                setData(generateMockData(evaluations, students));
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted/80 sm:px-4 sm:py-2 sm:text-sm"
            >
              <X className="h-3.5 w-3.5" />
              清除
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {SUMMARY.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-card transition-transform hover:-translate-y-0.5 sm:p-4 lg:p-5">
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg sm:h-12 sm:w-12', item.bg)}>
                <Icon className={cn('h-5 w-5 sm:h-6 sm:w-6', item.text)} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">{item.label}</div>
                <div className="mt-0.5 flex items-baseline gap-1">
                  <span className="text-lg font-bold text-foreground sm:text-xl lg:text-2xl">{item.value}</span>
                  <span className="text-xs text-muted-foreground">{item.suffix}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="flex flex-col rounded-xl bg-card p-4 shadow-card lg:col-span-3 sm:p-5" style={{ minHeight: '280px' }}>
          <h3 className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-foreground sm:mb-5 sm:text-base">
            <BarChart3 className="h-3.5 w-3.5 text-primary sm:h-4 sm:w-4" />
            成绩分布
          </h3>
          <div className="flex-1 flex items-end gap-2 sm:gap-4">
            {data.distribution.map((bar) => {
              const heightPct = maxCount > 0 ? (bar.count / maxCount) * 100 : 0;
              return (
                <div key={bar.range} className="flex flex-1 flex-col items-center gap-2">
                  <div className="text-xs font-semibold text-foreground">{bar.count}次</div>
                  <div className="flex h-20 w-full items-end overflow-hidden rounded-t-md bg-muted sm:h-64">
                    <div className={cn('w-full rounded-t-md transition-all', bar.color)} style={{ height: `${heightPct}%` }} />
                  </div>
                  <div className={cn('text-xs font-medium', bar.text)}>{bar.range}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl bg-card p-4 shadow-card lg:col-span-2 sm:p-5">
          <h3 className="mb-4 flex items-center justify-between text-sm font-semibold text-foreground sm:mb-5 sm:text-base">
            <span className="flex items-center gap-1.5">
              <Code className="h-3.5 w-3.5 text-accent-pink sm:h-4 sm:w-4" />
              易错知识点 TOP 5
            </span>
          </h3>
          <div className="space-y-3 sm:space-y-4">
            {data.topKp.map((kp, idx) => (
              <div key={idx} className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-start gap-2">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary sm:h-5 sm:w-5">{idx + 1}</span>
                  <span className="whitespace-pre-wrap break-all text-xs font-medium text-foreground sm:text-sm leading-relaxed">{kp.name}</span>
                </div>
                <span className="shrink-0 text-xs font-semibold text-muted-foreground pt-0.5">{kp.count} 次</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-card p-4 shadow-card sm:p-5">
        <h3 className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-foreground sm:mb-5 sm:text-base">
          <TrendingUp className="h-3.5 w-3.5 text-accent-green sm:h-4 sm:w-4" />
          四维度平均得分
        </h3>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {DIMENSIONS.map((dim) => (
            <RingProgress key={dim.name} percent={(dim.score / dim.full) * 100} color={dim.ring} label={dim.name} value={`${dim.score} / ${dim.full}`} />
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-card p-4 shadow-card sm:p-5">
        <h3 className="mb-4 flex items-center justify-between text-sm font-semibold text-foreground sm:mb-5 sm:text-base">
          <span className="flex items-center gap-1.5">
            <Code className="h-3.5 w-3.5 text-primary sm:h-4 sm:w-4" />
            我的评价记录
          </span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs">
                <th className="py-2 pr-3 sm:py-2.5 sm:pr-4">题目</th>
                <th className="py-2 pr-3 sm:py-2.5 sm:pr-4">总分</th>
                <th className="py-2 pr-3 sm:py-2.5 sm:pr-4">等级</th>
                <th className="py-2 sm:py-2.5">评价时间</th>
              </tr>
            </thead>
            <tbody>
              {data.recentRecords.length > 0 ? (
                data.recentRecords.map((rec) => (
                  <tr key={rec.id} className="border-b border-border/50 last:border-0 hover:bg-muted/40 transition-colors">
                    <td className="py-2 pr-3 text-muted-foreground sm:py-3 sm:pr-4">{rec.title}</td>
                    <td className="py-2 pr-3 font-bold text-foreground sm:py-3 sm:pr-4">{rec.score}</td>
                    <td className="py-2 pr-3 sm:py-3 sm:pr-4">
                      <span className={cn('inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold sm:px-2 sm:text-xs', levelBadgeClass(rec.level))}>
                        {rec.level}
                      </span>
                    </td>
                    <td className="py-2 text-muted-foreground sm:py-3">{rec.time}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-muted-foreground sm:py-8">暂无评价记录</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl bg-card p-4 shadow-card sm:p-5">
        <h3 className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-foreground sm:mb-5 sm:text-base">
          <Quote className="h-3.5 w-3.5 text-amber-700 sm:h-4 sm:w-4" />
          知识点词云
        </h3>
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2 py-4 sm:gap-x-4 sm:gap-y-3 sm:py-6">
          {WORDCLOUD.map((w) => (
            <span key={w.text} className={cn('cursor-default transition-transform hover:-translate-y-0.5', w.size, w.weight, w.color)}>
              {w.text}
            </span>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-center gap-2 border-t border-border/50 pt-3 text-[10px] text-muted-foreground sm:mt-4 sm:gap-3 sm:pt-4 sm:text-xs">
          <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
          <span>字号代表知识点重要程度</span>
        </div>
      </div>
    </div>

      {generatingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="rounded-2xl bg-white p-8 shadow-2xl max-w-md w-full mx-4">
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent-purple/20">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent-purple">
                  <FileText className="h-7 w-7 text-white animate-pulse" />
                </div>
              </div>
              <h2 className="mb-2 text-lg font-bold text-foreground">正在生成学情诊断报告</h2>
              <p className="mb-6 text-sm text-muted-foreground">
                正在分析学习数据并生成个性化报告，请稍候...
              </p>
              <div className="w-full">
                <div className="mb-2 flex justify-between text-xs font-medium text-muted-foreground">
                  <span>处理进度</span>
                  <span>{reportProgress}%</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent-purple transition-all duration-100"
                    style={{ width: `${reportProgress}%` }}
                  />
                </div>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                报告将自动下载到您的设备，可通过浏览器打开查看
              </p>
            </div>
          </div>
        </div>
      )}
    </ProtectedLayout>
  );
}