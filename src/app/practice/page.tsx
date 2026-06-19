'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Play, ChevronLeft, ChevronRight, Lightbulb, FileText, Terminal, Eye, Lock } from 'lucide-react';
import { questions, type Question } from '@/data/python_questions';
import { cn } from '@/lib/utils';
import { validateSession, type Student } from '@/lib/auth';
import { ProtectedLayout } from '@/components/protected-layout';

/**
 * 分页大小常量
 */
const PAGE_SIZE = 10;

/**
 * 参考答案密码
 */
const ANSWER_PASSWORD = 'mlszs';

/**
 * Python试题演练页面
 * 
 * 提供100道精选Python练习题，包含：
 * - 左侧题目列表（分页展示）
 * - 右侧代码编辑器
 * - 代码在线执行功能
 * - 题目提示和参考答案（密码保护）
 * - 一键填充到评价页面功能
 * 
 * @page
 * @author 码上成长项目组
 * @version 1.0.0
 */
export default function PracticePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ type: 'student'; user: Student } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [inputData, setInputData] = useState('');

  const totalPages = Math.ceil(questions.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const currentQuestions = questions.slice(startIndex, endIndex);

  useEffect(() => {
    const checkSession = async () => {
      const result = await validateSession();
      if (!result.success || result.userType === 'admin') {
        router.push('/login');
        return;
      }
      if (result.user && result.userType === 'student') {
        setCurrentUser({ type: 'student', user: result.user as Student });
      }
    };
    checkSession();
  }, [router]);

  useEffect(() => {
    if (selectedQuestion) {
      setCode('');
      setOutput('');
      setShowHint(false);
      setShowAnswer(false);
    }
  }, [selectedQuestion]);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleSelectQuestion = (question: Question) => {
    setSelectedQuestion(question);
  };

  const handleFillToEvaluation = (question: Question) => {
    sessionStorage.setItem('evaluation-question', question.content);
    alert('题目已填充到代码评价页面！');
  };

  const handleFillCodeToEvaluation = () => {
    sessionStorage.setItem('evaluation-code', code);
    alert('代码已填充到代码评价页面！');
  };

  const checkPassword = () => {
    if (password === ANSWER_PASSWORD) {
      setShowAnswer(true);
      setShowPasswordModal(false);
      setPassword('');
      setPasswordError('');
      if (selectedQuestion) {
        setCode(selectedQuestion.exampleCode);
      }
    } else {
      setPasswordError('密码错误，请重试');
    }
  };

  const runCode = async () => {
    if (!code.trim()) {
      setOutput('请输入要执行的代码');
      return;
    }
    
    setIsRunning(true);
    setOutput('');
    
    try {
      const inputs = inputData.split('\n').filter(line => line.trim());
      const response = await fetch('/api/run-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, inputs }),
      });
      
      const result = await response.json();
      if (result.success) {
        setOutput(result.output);
      } else {
        setOutput(`错误: ${result.error}`);
      }
    } catch (error) {
      setOutput(`执行失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">Python 试题演练</h1>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          选择题目进行练习，编写代码并执行测试
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row">
        {/* 左侧题目列表 */}
        <div className="w-full shrink-0 lg:w-[40%]">
          <div className="rounded-xl bg-card p-4 shadow-card sm:p-5">
            <div className="mb-3 sm:mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground sm:text-base">
                <FileText className="h-4 w-4 text-primary" />
                题目列表
              </h2>
              <span className="text-xs text-muted-foreground">
                共 {questions.length} 道题
              </span>
            </div>

            {/* 题目列表 */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 sm:max-h-[500px]">
              {currentQuestions.map((question) => (
                <div
                  key={question.id}
                  onClick={() => handleSelectQuestion(question)}
                  className={cn(
                    'group flex items-start gap-2 rounded-lg p-2.5 cursor-pointer transition-all sm:gap-3 sm:p-3',
                    selectedQuestion?.id === question.id
                      ? 'bg-primary/10 border border-primary/20'
                      : 'bg-muted/50 hover:bg-muted',
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary sm:px-2">
                        {question.id}
                      </span>
                      <h3 className="truncate text-xs font-medium text-foreground sm:text-sm">
                        {question.title}
                      </h3>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFillToEvaluation(question);
                    }}
                    className="opacity-0 group-hover:opacity-100 rounded-full bg-primary/10 p-1 text-primary transition-all hover:bg-primary hover:text-primary-foreground sm:p-1.5"
                    title="填充到代码评价"
                  >
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* 分页 */}
            <div className="mt-3 sm:mt-4 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                第 {currentPage} / {totalPages} 页
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 sm:px-3 sm:py-1.5 sm:text-sm"
                >
                  <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + Math.max(1, currentPage - 2);
                    if (pageNum > totalPages) return null;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={cn(
                          'w-6 rounded-lg py-0.5 text-xs font-medium transition-colors sm:w-7 sm:py-1',
                          currentPage === pageNum
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted',
                        )}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 sm:px-3 sm:py-1.5 sm:text-sm"
                >
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧代码执行区 */}
        <div className="min-w-0 flex-1 space-y-4 sm:space-y-5">
          {/* 题目详情 */}
          {selectedQuestion ? (
            <>
              <div className="rounded-xl bg-card p-4 shadow-card sm:p-5">
                <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:gap-0">
                  <h2 className="flex items-center gap-2 text-base font-semibold text-foreground sm:text-lg">
                    <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary sm:px-2">
                      {selectedQuestion.id}
                    </span>
                    {selectedQuestion.title}
                  </h2>
                  <button
                    onClick={() => setShowHint(!showHint)}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted sm:px-3 sm:py-1.5 sm:text-sm"
                  >
                    <Lightbulb className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    {showHint ? '隐藏提示' : '显示提示'}
                  </button>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {selectedQuestion.content}
                </p>
                {showHint && (
                  <div className="mt-2 rounded-lg bg-accent-yellow/10 p-2 sm:mt-3 sm:p-3">
                    <p className="text-xs leading-relaxed text-amber-700 sm:text-sm">
                      💡 {selectedQuestion.hint}
                    </p>
                  </div>
                )}
              </div>

              {/* 代码编辑器 */}
              <div className="rounded-xl bg-card p-4 shadow-card sm:p-5">
                <div className="mb-2 sm:mb-3 flex flex-col items-start justify-between gap-2 sm:flex-row sm:gap-0">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Terminal className="h-4 w-4 text-primary" />
                    Python 代码
                  </h3>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {!showAnswer && (
                      <button
                        onClick={() => setShowPasswordModal(true)}
                        className="flex items-center gap-1 rounded-lg bg-accent-green/10 px-2.5 py-1 text-xs font-medium text-accent-green transition-colors hover:bg-accent-green hover:text-white sm:px-3 sm:py-1.5 sm:text-sm"
                      >
                        <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        查看答案
                      </button>
                    )}
                    <button
                      onClick={handleFillCodeToEvaluation}
                      className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground sm:px-3 sm:py-1.5 sm:text-sm"
                    >
                      <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      填充评价
                    </button>
                  </div>
                </div>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="# 在这里编写你的 Python 代码"
                  rows={5}
                  spellCheck={false}
                  className="w-full resize-none rounded-lg border-none bg-[#1E1E2E] px-3 py-2 font-mono text-xs leading-relaxed text-[#CDD6F4] placeholder:text-[#6C7086] focus:outline-none focus:ring-2 focus:ring-primary/30 sm:rows-8 sm:px-4 sm:py-3 sm:text-sm"
                />
                <div className="mt-2 sm:mt-3 flex items-center justify-between">
                  <button
                    onClick={runCode}
                    disabled={isRunning}
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all sm:px-4 sm:py-2 sm:text-sm',
                      isRunning
                        ? 'bg-muted text-muted-foreground cursor-not-allowed'
                        : 'bg-primary text-primary-foreground hover:opacity-90',
                    )}
                  >
                    {isRunning ? (
                      <>
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground sm:h-4 sm:w-4" />
                        运行中...
                      </>
                    ) : (
                      <>
                        <Play className="h-3 w-3 sm:h-4 sm:w-4" />
                        执行代码
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 输入数据 */}
              <div className="rounded-xl bg-card p-4 shadow-card sm:p-5">
                <h3 className="mb-2 text-sm font-semibold text-foreground">输入数据</h3>
                <p className="mb-1.5 text-xs text-muted-foreground">
                  如果代码中使用了 input() 函数，请在此输入测试数据，每行一个输入值
                </p>
                <textarea
                  value={inputData}
                  onChange={(e) => setInputData(e.target.value)}
                  placeholder="输入1&#10;输入2&#10;输入3"
                  rows={2}
                  spellCheck={false}
                  className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 sm:rows-3 sm:px-4 sm:py-3 sm:text-sm"
                />
              </div>

              {/* 输出结果 */}
              <div className="rounded-xl bg-card p-4 shadow-card sm:p-5">
                <h3 className="mb-2 text-sm font-semibold text-foreground">执行结果</h3>
                <div className="min-h-[100px] rounded-lg bg-[#1E1E2E] p-3 font-mono text-xs leading-relaxed text-[#CDD6F4] whitespace-pre-wrap break-all sm:min-h-[150px] sm:p-4 sm:text-sm">
                  {output || '执行结果将在这里显示...'}
                </div>
              </div>
            </>
          ) : (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl bg-card p-6 text-center shadow-card sm:min-h-[600px] sm:p-12">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 sm:mb-5 sm:h-16 sm:w-16">
                <Terminal className="h-5 w-5 text-primary sm:h-8 sm:w-8" />
              </div>
              <h3 className="mb-2 text-sm font-semibold text-foreground sm:text-base">
                请从左侧选择一道题目开始练习
              </h3>
              <p className="max-w-xs text-xs text-muted-foreground sm:text-sm">
                选择题目后，右侧将显示题目详情和代码编辑区域
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 密码弹窗 */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-xl bg-card p-4 shadow-dialog w-full max-w-sm mx-4 sm:p-6 sm:max-w-md">
            <div className="flex items-center gap-2 mb-3">
              <Lock className="h-5 w-5 text-primary" />
              <h3 className="text-base font-semibold text-foreground sm:text-lg">验证密码</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3 sm:text-sm sm:mb-4">
              请输入密码查看答案
            </p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && checkPassword()}
              placeholder="请输入密码"
              className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {passwordError && (
              <p className="mt-2 text-xs text-destructive">{passwordError}</p>
            )}
            <div className="mt-3 sm:mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPassword('');
                  setPasswordError('');
                }}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted sm:px-4 sm:py-2 sm:text-sm"
              >
                取消
              </button>
              <button
                onClick={checkPassword}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-all hover:opacity-90 sm:px-4 sm:py-2 sm:text-sm"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </ProtectedLayout>
  );
}
