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
  LogOut,
  Users,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateSession, logout, getEvaluations, getStudents, type Student, type EvaluationRecord } from '@/lib/auth';

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
}

interface RecentRecord {
  id: number;
  name: string;
  studentId: string;
  class: string;
  title: string;
  score: number;
  level: string;
  time: string;
}

interface DimensionStats {
  understanding: number;
  logic: number;
  readability: number;
  syntax: number;
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
 * 管理员学情统计页面组件
 * 展示所有学生的学习数据统计和分析
 */
export default function AdminStatisticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary>({ totalCount: 0, avgScore: 0, excellentRate: 0, kpCount: 112 });
  const [distribution, setDistribution] = useState<DistributionItem[]>([]);
  const [topKp, setTopKp] = useState<TopKpItem[]>([]);
  const [recentRecords, setRecentRecords] = useState<RecentRecord[]>([]);
  const [dimensionStats, setDimensionStats] = useState<DimensionStats>({ understanding: 25, logic: 21, readability: 20, syntax: 16 });
  const [showSearch, setShowSearch] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    studentName: '',
    className: '',
    minScore: '',
    maxScore: '',
  });
  const [classes, setClasses] = useState<string[]>([]);
  const [exportType, setExportType] = useState<string>('all');
  const [students, setStudents] = useState<Student[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluationRecord[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filteredEvaluations, setFilteredEvaluations] = useState<EvaluationRecord[]>([]);

  /**
   * 页面初始化时验证session并加载数据
   */
  useEffect(() => {
    const initPage = async () => {
      const result = await validateSession();
      if (!result.success || result.userType !== 'admin') {
        router.push('/login');
        return;
      }

      const [evals, studentsData] = await Promise.all([
        getEvaluations(),
        getStudents(),
      ]);
      setEvaluations(evals);
      setStudents(studentsData);
      const uniqueClasses = Array.from(new Set(studentsData.map(s => s.class))).sort();
      setClasses(uniqueClasses);
      updateStats(evals, studentsData);
      setLoading(false);
    };
    initPage();
  }, [router]);

  /**
   * 更新统计数据
   */
  const updateStats = (evals: EvaluationRecord[], studentsData: Student[]) => {
    const scores = evals.map(e => e.score);
    const totalCount = evals.length;
    const avgScore = totalCount > 0 ? scores.reduce((a, b) => a + b, 0) / totalCount : 0;
    const excellentCount = scores.filter(s => s >= 85).length;
    const excellentRate = totalCount > 0 ? (excellentCount / totalCount) * 100 : 0;

    setSummary({
      totalCount,
      avgScore: parseFloat(avgScore.toFixed(1)),
      excellentRate: parseFloat(excellentRate.toFixed(1)),
      kpCount: 112,
    });

    setDistribution([
      { range: '85-100', count: scores.filter(s => s >= 85).length, color: 'bg-accent-pink', text: 'text-accent-pink' },
      { range: '70-84', count: scores.filter(s => s >= 70 && s < 85).length, color: 'bg-accent-green', text: 'text-accent-green' },
      { range: '60-69', count: scores.filter(s => s >= 60 && s < 70).length, color: 'bg-primary', text: 'text-primary' },
      { range: '0-59', count: scores.filter(s => s < 60).length, color: 'bg-destructive', text: 'text-destructive' },
    ]);

    setTopKp([
      { name: '字典 — 创建字典大括号{}书写错误', count: 10 },
      { name: 'for 循环 — 遍历列表/字符串', count: 10 },
      { name: '字符串 — 切片起始/结束索引设置错误', count: 8 },
      { name: '元组 — 单元素元组末尾缺失逗号', count: 8 },
      { name: '列表 — insert() 指定位置插入', count: 8 },
    ]);

    setFilteredEvaluations(evals);
    setTotalPages(Math.ceil(evals.length / 10));
    setCurrentPage(1);
    updateRecentRecords(evals, studentsData, 1);
  };

  const updateRecentRecords = (evals: EvaluationRecord[], studentsData: Student[], page: number) => {
    const start = (page - 1) * 10;
    const end = start + 10;
    setRecentRecords(evals.slice(start, end).map(e => {
      const student = studentsData.find(s => s.studentId === e.studentId);
      const level = e.score >= 85 ? '优秀' : e.score >= 70 ? '良好' : e.score >= 60 ? '及格' : '待提升';
      return {
        id: e.id,
        name: student?.name || '未知学生',
        studentId: student?.studentId || '',
        class: student?.class || '',
        title: e.question.substring(0, 30) + (e.question.length > 30 ? '...' : ''),
        score: e.score,
        level,
        time: new Date(e.createdAt).toLocaleString(),
      };
    }));
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      updateRecentRecords(filteredEvaluations, students, page);
    }
  };

  /**
   * 处理退出登录
   */
  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  /**
   * 处理搜索筛选
   */
  const handleSearch = () => {
    let filtered = evaluations;
    if (searchFilters.studentName) {
      filtered = filtered.filter(e => {
        const student = students.find(s => s.studentId === e.studentId);
        return student?.name.includes(searchFilters.studentName);
      });
    }
    if (searchFilters.className) {
      filtered = filtered.filter(e => {
        const student = students.find(s => s.studentId === e.studentId);
        return student?.class === searchFilters.className;
      });
    }
    if (searchFilters.minScore) filtered = filtered.filter(e => e.score >= parseInt(searchFilters.minScore));
    if (searchFilters.maxScore) filtered = filtered.filter(e => e.score <= parseInt(searchFilters.maxScore));
    updateStats(filtered, students);
  };

  /**
   * 导出学情记录为CSV
   */
  const handleExport = () => {
    let recordsToExport = recentRecords;
    let fileName = '学情记录.csv';

    if (exportType === 'class' && searchFilters.className) {
      recordsToExport = recentRecords.filter(r => r.class === searchFilters.className);
      fileName = `${searchFilters.className}-学情记录.csv`;
    } else if (exportType === 'student' && searchFilters.studentName) {
      recordsToExport = recentRecords.filter(r => r.name.includes(searchFilters.studentName));
      fileName = `${searchFilters.studentName}-学情记录.csv`;
    } else if (exportType === 'all') {
      fileName = '全部学情记录.csv';
    }

    const csv = [['学生姓名', '学号', '班级', '题目', '总分', '等级', '评价时间']]
      .concat(recordsToExport.map(r => {
        return [r.name, r.studentId, r.class, r.title, r.score.toString(), r.level, r.time];
      }))
      .map(row => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const maxCount = Math.max(...distribution.map((d) => d.count), 1);

  const SUMMARY = [
    { label: '总评价次数', value: summary.totalCount.toString(), suffix: '次', icon: Activity, bg: 'bg-primary/10', text: 'text-primary' },
    { label: '平均分', value: summary.avgScore.toString(), suffix: '分', icon: Trophy, bg: 'bg-accent-yellow/15', text: 'text-amber-700' },
    { label: '优秀率', value: summary.excellentRate.toString(), suffix: '%', icon: Star, bg: 'bg-accent-green/15', text: 'text-accent-green' },
    { label: '易错知识点', value: summary.kpCount.toString(), suffix: '个', icon: Lightbulb, bg: 'bg-accent-pink/15', text: 'text-accent-pink' },
  ];

  const DIMENSIONS = [
    { name: '题目理解与实现', score: dimensionStats.understanding, full: 30, ring: '#FFD166' },
    { name: '逻辑思路', score: dimensionStats.logic, full: 25, ring: '#55C59D' },
    { name: '代码可读性', score: dimensionStats.readability, full: 25, ring: '#5B6CFF' },
    { name: '语法掌握', score: dimensionStats.syntax, full: 20, ring: '#FF7AB6' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-primary" />
              <span className="text-lg font-bold text-foreground">管理员后台</span>
            </div>
            <nav className="flex items-center gap-2">
              <button onClick={() => router.push('/admin?tab=students')} className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}>
                <Users className="w-4 h-4" />
                学生管理
              </button>
              <button onClick={() => router.push('/admin?tab=questions')} className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}>
                <FileText className="w-4 h-4" />
                题库管理
              </button>
              <button onClick={() => router.push('/admin?tab=evaluations')} className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}>
                <BarChart3 className="w-4 h-4" />
                学情记录
              </button>
              <button className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium',
                'bg-primary text-primary-foreground'
              )}>
                <TrendingUp className="w-4 h-4" />
                学情分析
              </button>
            </nav>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="w-4 h-4" />
            退出登录
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">学情统计</h1>
            <p className="mt-1 text-sm text-muted-foreground">所有学生的学习数据分析汇总</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
                showSearch
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground hover:bg-muted/80'
              )}
            >
              <Search className="h-4 w-4" />
              {showSearch ? '隐藏搜索' : '搜索筛选'}
            </button>
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent-green px-4 py-2 text-sm font-semibold text-white shadow-float transition-all hover:opacity-90"
            >
              <Download className="h-4 w-4" />
              导出全部
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
                <input
                  type="text"
                  value={searchFilters.studentName}
                  onChange={(e) => setSearchFilters({ ...searchFilters, studentName: e.target.value })}
                  placeholder="输入学生姓名"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">班级</label>
                <select
                  value={searchFilters.className}
                  onChange={(e) => setSearchFilters({ ...searchFilters, className: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">全部班级</option>
                  {classes.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
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
                onClick={handleSearch}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-float transition-all hover:opacity-90"
              >
                <Search className="h-4 w-4" />
                搜索
              </button>
              <button
                onClick={async () => {
                  setSearchFilters({ studentName: '', className: '', minScore: '', maxScore: '' });
                  const [evals, studentsData] = await Promise.all([getEvaluations(), getStudents()]);
                  updateStats(evals, studentsData);
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
              {distribution.map((bar) => {
                const heightPct = maxCount > 0 ? (bar.count / maxCount) * 100 : 0;
                return (
                  <div key={bar.range} className="flex flex-1 flex-col items-center gap-2">
                    <div className="text-xs font-semibold text-foreground">{bar.count}人</div>
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
              {topKp.map((kp, idx) => (
                <div key={kp.name} className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{idx + 1}</span>
                    <span className="truncate text-sm font-medium text-foreground">{kp.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-semibold text-muted-foreground">{kp.count} 次</span>
                    <button className="text-xs text-primary hover:underline">导出</button>
                  </div>
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
              最近评价记录
            </span>
            <div className="flex items-center gap-2">
              <select
                value={exportType}
                onChange={(e) => setExportType(e.target.value)}
                className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground"
              >
                <option value="all">导出全部</option>
                <option value="class">按班级导出</option>
                <option value="student">按学生导出</option>
              </select>
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                <Download className="h-4 w-4" />
                导出
              </button>
            </div>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="py-2.5 pr-4">学生姓名</th>
                  <th className="py-2.5 pr-4">班级</th>
                  <th className="py-2.5 pr-4">题目</th>
                  <th className="py-2.5 pr-4">总分</th>
                  <th className="py-2.5 pr-4">等级</th>
                  <th className="py-2.5">评价时间</th>
                </tr>
              </thead>
              <tbody>
                {recentRecords.length > 0 ? (
                  recentRecords.map((rec) => (
                    <tr key={rec.id} className="border-b border-border/50 last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="py-3 pr-4 text-foreground">{rec.name}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{rec.class}</td>
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
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">暂无评价记录</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-center gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="inline-flex items-center justify-center rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50 disabled:pointer-events-none"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = totalPages <= 5 ? i + 1 : 
                currentPage <= 3 ? i + 1 : 
                currentPage >= totalPages - 2 ? totalPages - 4 + i : 
                currentPage - 2 + i;
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={cn(
                    "min-w-8 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    currentPage === pageNum
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-background text-foreground hover:bg-muted"
                  )}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="inline-flex items-center justify-center rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50 disabled:pointer-events-none"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-2 text-center text-xs text-muted-foreground">
            第 {currentPage} / {totalPages} 页，共 {filteredEvaluations.length} 条记录
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
    </div>
  );
}