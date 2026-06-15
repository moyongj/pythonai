'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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

interface Summary {
  totalCount: number;
  avgScore: number;
  excellentRate: number;
  kpCount: number;
}

interface DistributionItem {
  range: string;
  count: number;
  color: string;
  text: string;
}

interface TopKpItem {
  name: string;
  count: number;
  percent: number;
}

interface RecentRecord {
  id: number;
  name: string;
  title: string;
  score: number;
  level: string;
  kp: string;
  time: string;
}

interface DimensionStats {
  understanding: number;
  logic: number;
  readability: number;
  syntax: number;
}

interface Pagination {
  page: number;
  limit: number;
  totalPages: number;
  totalRecords: number;
}

interface StatisticsData {
  summary: Summary;
  distribution: DistributionItem[];
  topKp: TopKpItem[];
  recentRecords: RecentRecord[];
  dimensionStats: DimensionStats;
  pagination: Pagination;
}

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

  const topKp: TopKpItem[] = [
    { name: '字典 — 创建字典大括号{}书写错误', count: 10, percent: 20 },
    { name: 'for 循环 — 遍历列表/字符串', count: 10, percent: 20 },
    { name: '字符串 — 切片起始/结束索引设置错误', count: 8, percent: 16 },
    { name: '元组 — 单元素元组末尾缺失逗号', count: 8, percent: 16 },
    { name: '列表 — insert() 指定位置插入', count: 8, percent: 16 },
  ];

  const recentRecords: RecentRecord[] = evaluations.slice(0, 10).map(e => {
    const student = students.find(s => s.studentId === e.studentId);
    const level = e.score >= 85 ? '优秀' : e.score >= 70 ? '良好' : e.score >= 60 ? '及格' : '待提升';
    return {
      id: e.id,
      name: student?.name || '未知学生',
      title: e.question.substring(0, 30) + (e.question.length > 30 ? '...' : ''),
      score: e.score,
      level,
      kp: '基础语法',
      time: new Date(e.createdAt).toLocaleString(),
    };
  });

  return {
    summary: {
      totalCount,
      avgScore: parseFloat(avgScore.toFixed(1)),
      excellentRate: parseFloat(excellentRate.toFixed(1)),
      kpCount: 112,
    },
    distribution,
    topKp,
    recentRecords,
    dimensionStats: {
      understanding: 25,
      logic: 21,
      readability: 20,
      syntax: 16,
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
 * 学情统计页面组件
 * 展示学生的学习数据统计和分析
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
      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">我的学情统计</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {currentUser.user.name}（{currentUser.user.class}）的学习数据分析
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
              showSearch
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground hover:bg-primary/10'
            )}
          >
            <Search className="h-4 w-4" />
            {showSearch ? '隐藏搜索' : '搜索筛选'}
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
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent-green px-4 py-2 text-sm font-semibold text-white shadow-float transition-all hover:opacity-90"
          >
            <Download className="h-4 w-4" />
            导出我的记录
          </button>
        </div>
      </div>

      {showSearch && (
        <div className="rounded-xl bg-card p-5 shadow-card">
          <h3 className="mb-4 flex items-center gap-1.5 text-base font-semibold text-foreground">
            <Search className="h-4 w-4 text-primary" />
            搜索筛选
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">学生姓名</label>
              <select
                value={searchFilters.studentName}
                onChange={(e) => setSearchFilters({ ...searchFilters, studentName: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">{currentUser.user.name}</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">最低分数</label>
              <input
                type="number"
                min="0"
                max="100"
                value={searchFilters.minScore}
                onChange={(e) => setSearchFilters({ ...searchFilters, minScore: e.target.value })}
                placeholder="0"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">最高分数</label>
              <input
                type="number"
                min="0"
                max="100"
                value={searchFilters.maxScore}
                onChange={(e) => setSearchFilters({ ...searchFilters, maxScore: e.target.value })}
                placeholder="100"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => {
                let filtered = evaluations;
                if (searchFilters.minScore) filtered = filtered.filter(e => e.score >= parseInt(searchFilters.minScore));
                if (searchFilters.maxScore) filtered = filtered.filter(e => e.score <= parseInt(searchFilters.maxScore));
                setData(generateMockData(filtered, students));
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-float transition-all hover:opacity-90"
            >
              <Search className="h-4 w-4" />
              搜索
            </button>
            <button
              onClick={() => {
                setSearchFilters({ studentName: '', minScore: '', maxScore: '' });
                setData(generateMockData(evaluations, students));
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted/80"
            >
              <X className="h-4 w-4" />
              清除
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SUMMARY.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-center gap-4 rounded-xl bg-card p-5 shadow-card transition-transform hover:-translate-y-0.5">
              <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', item.bg)}>
                <Icon className={cn('h-6 w-6', item.text)} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">{item.label}</div>
                <div className="mt-0.5 flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-foreground">{item.value}</span>
                  <span className="text-xs text-muted-foreground">{item.suffix}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <div className="rounded-xl bg-card p-5 shadow-card lg:col-span-3">
          <h3 className="mb-5 flex items-center gap-1.5 text-base font-semibold text-foreground">
            <BarChart3 className="h-4 w-4 text-primary" />
            成绩分布
          </h3>
          <div className="flex h-56 items-end gap-4">
            {data.distribution.map((bar) => {
              const heightPct = maxCount > 0 ? (bar.count / maxCount) * 100 : 0;
              return (
                <div key={bar.range} className="flex flex-1 flex-col items-center gap-2">
                  <div className="text-xs font-semibold text-foreground">{bar.count}次</div>
                  <div className="flex h-44 w-full items-end overflow-hidden rounded-t-md bg-muted">
                    <div className={cn('w-full rounded-t-md transition-all', bar.color)} style={{ height: `${heightPct}%` }} />
                  </div>
                  <div className={cn('text-xs font-medium', bar.text)}>{bar.range}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl bg-card p-5 shadow-card lg:col-span-2">
          <h3 className="mb-5 flex items-center justify-between text-base font-semibold text-foreground">
            <span className="flex items-center gap-1.5">
              <Code className="h-4 w-4 text-accent-pink" />
              易错知识点 TOP 5
            </span>
          </h3>
          <div className="space-y-4">
            {data.topKp.map((kp, idx) => (
              <div key={kp.name} className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{idx + 1}</span>
                  <span className="truncate text-sm font-medium text-foreground">{kp.name}</span>
                </div>
                <span className="shrink-0 text-xs font-semibold text-muted-foreground">{kp.count} 次</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-card p-5 shadow-card">
        <h3 className="mb-5 flex items-center gap-1.5 text-base font-semibold text-foreground">
          <TrendingUp className="h-4 w-4 text-accent-green" />
          四维度平均得分
        </h3>
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {DIMENSIONS.map((dim) => (
            <RingProgress key={dim.name} percent={(dim.score / dim.full) * 100} color={dim.ring} label={dim.name} value={`${dim.score} / ${dim.full}`} />
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-card p-5 shadow-card">
        <h3 className="mb-5 flex items-center justify-between text-base font-semibold text-foreground">
          <span className="flex items-center gap-1.5">
            <Code className="h-4 w-4 text-primary" />
            我的评价记录
          </span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="py-2.5 pr-4">题目</th>
                <th className="py-2.5 pr-4">总分</th>
                <th className="py-2.5 pr-4">等级</th>
                <th className="py-2.5">评价时间</th>
              </tr>
            </thead>
            <tbody>
              {data.recentRecords.length > 0 ? (
                data.recentRecords.map((rec) => (
                  <tr key={rec.id} className="border-b border-border/50 last:border-0 hover:bg-muted/40 transition-colors">
                    <td className="py-3 pr-4 text-muted-foreground">{rec.title}</td>
                    <td className="py-3 pr-4 font-bold text-foreground">{rec.score}</td>
                    <td className="py-3 pr-4">
                      <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold', levelBadgeClass(rec.level))}>
                        {rec.level}
                      </span>
                    </td>
                    <td className="py-3 text-muted-foreground">{rec.time}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground">暂无评价记录</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl bg-card p-5 shadow-card">
        <h3 className="mb-5 flex items-center gap-1.5 text-base font-semibold text-foreground">
          <Quote className="h-4 w-4 text-amber-700" />
          知识点词云
        </h3>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 py-6">
          {WORDCLOUD.map((w) => (
            <span key={w.text} className={cn('cursor-default transition-transform hover:-translate-y-0.5', w.size, w.weight, w.color)}>
              {w.text}
            </span>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-center gap-3 border-t border-border/50 pt-4 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3" />
          <span>字号代表知识点重要程度</span>
        </div>
      </div>
    </div>
    </ProtectedLayout>
  );
}