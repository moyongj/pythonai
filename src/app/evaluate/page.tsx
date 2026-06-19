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
import { ProtectedLayout } from '@/components/protected-layout';

/**
 * 评价维度键值类型
 */
type DimensionKey =
  | 'understanding'   // 题目理解与实现
  | 'logic'           // 逻辑思路
  | 'readability'     // 代码可读性
  | 'syntax';         // 语法掌握

/**
 * 评价维度接口
 */
interface Dimension {
  key: DimensionKey;
  name: string;
  score: number;
  full: number;
  comment: string;
  color: 'yellow' | 'green' | 'primary' | 'pink';
}

/**
 * 评价报告接口
 */
interface EvaluationReport {
  studentName: string;
  dimensions: Dimension[];
  totalScore: number;
  level: string;
  hint: string;
  practice: string;
  knowledgePoints: string[];
}

/**
 * 维度图标映射
 */
const ICON_MAP: Record<DimensionKey, typeof Target> = {
  understanding: Target,
  logic: Brain,
  readability: Eye,
  syntax: Code,
};

/**
 * 颜色映射配置
 */
const COLOR_MAP: Record<Dimension['color'], { bar: string; text: string; border: string }> = {
  yellow: { bar: 'bg-accent-yellow', text: 'text-accent-yellow', border: 'border-l-accent-yellow' },
  green: { bar: 'bg-accent-green', text: 'text-accent-green', border: 'border-l-accent-green' },
  primary: { bar: 'bg-primary', text: 'text-primary', border: 'border-l-primary' },
  pink: { bar: 'bg-accent-pink', text: 'text-accent-pink', border: 'border-l-accent-pink' },
};

/**
 * 将总分转换为等级
 * 
 * @param {number} total - 总分
 * @returns {string} 等级：优秀、良好、及格、待提升
 */
function scoreToLevel(total: number): string {
  if (total >= 85) return '优秀';
  if (total >= 70) return '良好';
  if (total >= 60) return '及格';
  return '待提升';
}

/**
 * 根据等级获取徽章样式类
 * 
 * @param {string} level - 等级
 * @returns {string} Tailwind CSS样式类
 */
function levelToBadgeClass(level: string): string {
  if (level === '优秀') return 'bg-accent-green/15 text-accent-green';
  if (level === '良好') return 'bg-primary/15 text-primary';
  if (level === '及格') return 'bg-accent-yellow/20 text-amber-700';
  return 'bg-destructive/15 text-destructive';
}

/**
 * 代码智能评价页面
 * 
 * 提供四维度代码评价功能：
 * - 题目理解与实现（30分）
 * - 逻辑思路（25分）
 * - 代码可读性（25分）
 * - 语法掌握（20分）
 * 
 * 包含评价表单、评价结果展示、个性化学习建议等功能。
 * 
 * @page
 * @author 码上成长项目组
 * @version 1.0.0
 */
export default function EvaluatePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ type: 'student'; user: Student } | null>(null);
  const [name, setName] = useState('');
  const [question, setQuestion] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const result = await validateSession();
      if (!result.success || result.userType === 'admin') {
        router.push('/');
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
    <ProtectedLayout>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-4 space-y-2 sm:mb-6 sm:space-y-4">
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">
            提交你的代码，让 AI 帮你诊断成长方向
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            填写姓名、题目和代码，AI 将从四个维度静态分析并生成个性化报告
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
          <div className="w-full space-y-4 sm:w-2/5 sm:space-y-6">
            <div className="space-y-4 rounded-xl bg-card p-4 shadow-card sm:p-5">
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
                  rows={4}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="请粘贴你的题目要求"
                  className="w-full resize-none rounded-md border-none bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 sm:rows-5"
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
                  rows={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="# 在这里粘贴你的 Python 代码"
                  spellCheck={false}
                  className="w-full resize-none rounded-lg border-none bg-[#1E1E2E] px-3 py-2.5 font-mono text-xs leading-relaxed text-[#CDD6F4] placeholder:text-[#6C7086] focus:outline-none focus:ring-2 focus:ring-primary/30 sm:rows-10 sm:px-4 sm:py-3 sm:text-sm"
                />
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="flex flex-col items-center justify-between gap-3 pt-1 sm:flex-row">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-float transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
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

          <div className="w-full min-w-0 sm:w-3/5">
            {loading && (
              <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl bg-card p-8 text-center shadow-card sm:min-h-full sm:p-12">
                <Loader2 className="mb-4 h-10 w-10 animate-spin text-primary sm:h-12 sm:w-12" />
                <h3 className="text-sm font-semibold text-foreground sm:text-base">
                  AI 正在分析你的代码…
                </h3>
                <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
                  这通常需要 5-15 秒，请稍候
                </p>
              </div>
            )}

            {!loading && !report && (
              <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl bg-card p-8 text-center shadow-card sm:min-h-full sm:p-12">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 sm:mb-5 sm:h-16 sm:w-16">
                  <ClipboardCheck className="h-6 w-6 text-primary sm:h-8 sm:w-8" />
                </div>
                <h3 className="mb-2 text-sm font-semibold text-foreground sm:text-base">
                  提交代码后，评价报告将在这里展示
                </h3>
                <p className="max-w-xs text-xs text-muted-foreground sm:text-sm">
                  在左侧填写信息并点击「开始评价」，AI 将为你生成详细的代码诊断报告
                </p>
              </div>
            )}

            {!loading && report && (
              <div className="space-y-4 sm:space-y-5">
                <div className="rounded-xl bg-card p-4 shadow-card sm:p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 sm:h-10 sm:w-10">
                      <User className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">评价报告</p>
                      <h2 className="text-base font-bold text-foreground sm:text-lg">
                        {report.studentName}
                      </h2>
                    </div>
                  </div>
                  <div className="mt-3 h-1 rounded-full bg-gradient-to-r from-accent-yellow via-accent-green to-accent-pink opacity-60" />
                </div>

                <div className="rounded-xl bg-card p-4 shadow-card sm:p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                      <Trophy className="h-4 w-4 text-accent-yellow" />
                      综合评分
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-foreground sm:text-2xl">
                        {report.totalScore}
                        <span className="text-xs font-normal text-muted-foreground sm:text-sm">
                          /100分
                        </span>
                      </span>
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold sm:px-2.5 sm:py-1',
                          levelToBadgeClass(report.level),
                        )}
                      >
                        {report.level}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted sm:h-3">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent-yellow via-accent-green to-primary"
                      style={{ width: `${report.totalScore}%` }}
                    />
                  </div>
                </div>

                {report.dimensions.map((dim) => {
                  const colors = COLOR_MAP[dim.color];
                  const Icon = ICON_MAP[dim.key];
                  const percent = (dim.score / dim.full) * 100;
                  return (
                    <div
                      key={dim.key}
                      className={cn(
                        'flex gap-3 rounded-xl bg-card p-4 shadow-card border-l-4 sm:gap-4 sm:p-5',
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
                            <span className="text-xs font-normal text-muted-foreground sm:text-sm">
                              /{dim.full}分
                            </span>
                          </span>
                        </div>
                        <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-muted sm:h-2">
                          <div
                            className={cn('h-full rounded-full', colors.bar)}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                          {dim.comment}
                        </p>
                      </div>
                    </div>
                  );
                })}

                <div className="rounded-xl bg-accent-yellow/10 p-4 sm:p-5">
                  <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <Lightbulb className="h-4 w-4 text-accent-yellow" />
                    给你的提示（不是答案）
                  </h3>
                  <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap sm:text-sm">
                    {report.hint}
                  </p>
                </div>

                <div className="rounded-xl bg-accent-green/10 p-4 sm:p-5">
                  <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <PencilLine className="h-4 w-4 text-accent-green" />
                    类似练习题
                  </h3>
                  <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap sm:text-sm">
                    {report.practice}
                  </p>
                </div>

                {report.knowledgePoints.length > 0 && (
                  <div className="rounded-xl bg-primary/5 p-4 sm:p-5">
                    <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                      <AlertTriangle className="h-4 w-4 text-primary" />
                      本次涉及的易错知识点
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {report.knowledgePoints.map((kp, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary sm:px-3 sm:py-1.5 sm:text-sm"
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
    </ProtectedLayout>
  );
}