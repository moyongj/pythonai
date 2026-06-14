'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  FileText,
  Terminal,
  Sparkles,
  ClipboardCheck,
  Target,
  Brain,
  Eye,
  Code,
  Trophy,
  Lightbulb,
  PencilLine,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateSession, type Student } from '@/lib/auth';

type DimensionKey =
  | 'understanding'
  | 'logic'
  | 'readability'
  | 'syntax';

interface Dimension {
  key: DimensionKey;
  name: string;
  score: number;
  full: number;
  comment: string;
  color: 'yellow' | 'green' | 'primary' | 'pink';
}

interface EvaluationReport {
  studentName: string;
  dimensions: Dimension[];
  totalScore: number;
  level: string;
  hint: string;
  practice: string;
  knowledgePoints: string[];
}

const ICON_MAP: Record<DimensionKey, typeof Target> = {
  understanding: Target,
  logic: Brain,
  readability: Eye,
  syntax: Code,
};

const COLOR_MAP: Record<Dimension['color'], { bar: string; text: string; border: string }> = {
  yellow: { bar: 'bg-accent-yellow', text: 'text-accent-yellow', border: 'border-l-accent-yellow' },
  green: { bar: 'bg-accent-green', text: 'text-accent-green', border: 'border-l-accent-green' },
  primary: { bar: 'bg-primary', text: 'text-primary', border: 'border-l-primary' },
  pink: { bar: 'bg-accent-pink', text: 'text-accent-pink', border: 'border-l-accent-pink' },
};

/**
 * 根据总分计算等级
 */
function scoreToLevel(total: number): string {
  if (total >= 85) return '优秀';
  if (total >= 70) return '良好';
  if (total >= 60) return '及格';
  return '待提升';
}

/**
 * 根据等级获取徽章样式
 */
function levelToBadgeClass(level: string): string {
  if (level === '优秀') return 'bg-accent-green/15 text-accent-green';
  if (level === '良好') return 'bg-primary/15 text-primary';
  if (level === '及格') return 'bg-accent-yellow/20 text-amber-700';
  return 'bg-destructive/15 text-destructive';
}

/**
 * 主页组件 - 代码评价页面
 * 学生提交代码后AI进行智能诊断并生成评价报告
 */
export default function Home() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ type: 'student'; user: Student } | null>(null);
  const [name, setName] = useState('');
  const [question, setQuestion] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  /**
   * 页面初始化时验证session
   */
  useEffect(() => {
    const checkSession = async () => {
      const result = await validateSession();
      if (!result.success || result.userType === 'admin') {
        router.push('/login');
        return;
      }
      if (result.user && result.userType === 'student') {
        const student = result.user as Student;
        setCurrentUser({ type: 'student', user: student });
        setName(student.name);
      }
      setPageLoading(false);
    };
    checkSession();
  }, [router]);

  /**
   * 从sessionStorage恢复之前填写的内容
   */
  useEffect(() => {
    const storedQuestion = sessionStorage.getItem('evaluation-question');
    const storedCode = sessionStorage.getItem('evaluation-code');
    
    if (storedQuestion) {
      setQuestion(storedQuestion);
      sessionStorage.removeItem('evaluation-question');
    }
    
    if (storedCode) {
      setCode(storedCode);
      sessionStorage.removeItem('evaluation-code');
    }
  }, []);

  /**
   * 处理代码评价提交
   */
  async function handleSubmit() {
    if (!name.trim()) {
      setError('请填写学生姓名');
      return;
    }
    if (!question.trim()) {
      setError('请填写题目内容');
      return;
    }
    if (!code.trim()) {
      setError('请填写 Python 代码');
      return;
    }
    setError(null);
    setLoading(true);
    setReport(null);
    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, studentId: currentUser?.user.studentId, question, code }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || '评价失败，请稍后重试');
      }
      const reportData = data.report as EvaluationReport;
      setReport(reportData);
    } catch (e) {
      setError(e instanceof Error ? e.message : '评价失败');
    } finally {
      setLoading(false);
    }
  }

  if (pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* ========== 左栏 - 输入区域 ========== */}
        <div className="w-full shrink-0 space-y-6 lg:w-[40%]">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              提交你的代码，让 AI 帮你诊断成长方向
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              填写姓名、题目和代码，AI 将从四个维度静态分析并生成个性化报告
            </p>
          </div>

          <div className="space-y-5 rounded-xl bg-card p-5 shadow-card">
            <div className="space-y-1.5">
              <label
                htmlFor="input-name"
                className="flex items-center gap-1.5 text-sm font-semibold text-foreground"
              >
                <User className="h-3.5 w-3.5 text-primary" />
                学生姓名
              </label>
              <input
                id="input-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="请输入你的姓名"
                className="w-full rounded-md border-none bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="input-question"
                className="flex items-center gap-1.5 text-sm font-semibold text-foreground"
              >
                <FileText className="h-3.5 w-3.5 text-primary" />
                题目内容
              </label>
              <textarea
                id="input-question"
                rows={5}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="请粘贴你的题目要求"
                className="w-full resize-none rounded-md border-none bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="input-code"
                className="flex items-center gap-1.5 text-sm font-semibold text-foreground"
              >
                <Terminal className="h-3.5 w-3.5 text-primary" />
                Python 代码
              </label>
              <textarea
                id="input-code"
                rows={10}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="# 在这里粘贴你的 Python 代码"
                spellCheck={false}
                className="w-full resize-none rounded-lg border-none bg-[#1E1E2E] px-4 py-3 font-mono text-sm leading-relaxed text-[#CDD6F4] placeholder:text-[#6C7086] focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex items-center gap-4 pt-1">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-float transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    评价中…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    开始评价
                  </>
                )}
              </button>
              <span className="text-xs text-muted-foreground">
                AI 将从 4 个维度评估你的代码
              </span>
            </div>
          </div>
        </div>

        {/* ========== 右栏 - 评价报告区域 ========== */}
        <div className="min-w-0 flex-1">
          {loading && (
            <div className="flex min-h-[600px] flex-col items-center justify-center rounded-xl bg-card p-12 text-center shadow-card">
              <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
              <h3 className="text-base font-semibold text-foreground">
                AI 正在分析你的代码…
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                这通常需要 5-15 秒，请稍候
              </p>
            </div>
          )}

          {!loading && !report && (
            <div className="flex min-h-[600px] flex-col items-center justify-center rounded-xl bg-card p-12 text-center shadow-card">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <ClipboardCheck className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 text-base font-semibold text-foreground">
                提交代码后，评价报告将在这里展示
              </h3>
              <p className="max-w-xs text-sm text-muted-foreground">
                在左侧填写信息并点击「开始评价」，AI 将为你生成详细的代码诊断报告
              </p>
            </div>
          )}

          {!loading && report && (
            <div className="space-y-5">
              {/* 报告标题区域 */}
              <div className="rounded-xl bg-card p-5 shadow-card">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">评价报告</p>
                    <h2 className="text-lg font-bold text-foreground">
                      {report.studentName}
                    </h2>
                  </div>
                </div>
                <div className="mt-4 h-1 rounded-full bg-gradient-to-r from-accent-yellow via-accent-green to-accent-pink opacity-60" />
              </div>

              {/* 总分区域 */}
              <div className="rounded-xl bg-card p-5 shadow-card">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <Trophy className="h-4 w-4 text-accent-yellow" />
                    综合评分
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-foreground">
                      {report.totalScore}
                      <span className="text-sm font-normal text-muted-foreground">
                        /100分
                      </span>
                    </span>
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
                        levelToBadgeClass(report.level),
                      )}
                    >
                      {report.level}
                    </span>
                  </div>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent-yellow via-accent-green to-primary"
                    style={{ width: `${report.totalScore}%` }}
                  />
                </div>
              </div>

              {/* 四大维度评分卡片 */}
              {report.dimensions.map((dim) => {
                const colors = COLOR_MAP[dim.color];
                const Icon = ICON_MAP[dim.key];
                const percent = (dim.score / dim.full) * 100;
                return (
                  <div
                    key={dim.key}
                    className={cn(
                      'flex gap-4 rounded-xl bg-card p-5 shadow-card border-l-4',
                      colors.border,
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                          <Icon className={cn('h-4 w-4', colors.text)} />
                          {dim.name}
                        </h3>
                        <span className="text-base font-bold text-foreground">
                          {dim.score}
                          <span className="text-sm font-normal text-muted-foreground">
                            /{dim.full}分
                          </span>
                        </span>
                      </div>
                      <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn('h-full rounded-full', colors.bar)}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {dim.comment}
                      </p>
                    </div>
                  </div>
                );
              })}

              {/* 提示区域 */}
              <div className="rounded-xl bg-accent-yellow/10 p-5">
                <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <Lightbulb className="h-4 w-4 text-accent-yellow" />
                  给你的提示（不是答案）
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {report.hint}
                </p>
              </div>

              {/* 练习题区域 */}
              <div className="rounded-xl bg-accent-green/10 p-5">
                <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <PencilLine className="h-4 w-4 text-accent-green" />
                  类似练习题
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {report.practice}
                </p>
              </div>

              {/* 易错知识点区域 */}
              {report.knowledgePoints.length > 0 && (
                <div className="rounded-xl bg-primary/5 p-5">
                  <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <AlertTriangle className="h-4 w-4 text-primary" />
                    本次涉及的易错知识点
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {report.knowledgePoints.map((kp, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
                      >
                        {kp}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}