'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Play, ChevronLeft, ChevronRight, Lightbulb, FileText, Terminal, Eye, Lock } from 'lucide-react';
import { questions, type Question } from '@/data/python_questions';
import { cn } from '@/lib/utils';
import { validateSession, type Student } from '@/lib/auth';

const PAGE_SIZE = 10;
const ANSWER_PASSWORD = 'mlszs';

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
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Python 试题演练</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          选择左侧题目进行练习，右侧编写代码并执行测试
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* 左侧题目列表 */}
        <div className="w-full shrink-0 lg:w-[40%]">
          <div className="rounded-xl bg-card p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                <FileText className="h-4 w-4 text-primary" />
                题目列表
              </h2>
              <span className="text-xs text-muted-foreground">
                共 {questions.length} 道题
              </span>
            </div>

            {/* 题目列表 */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
              {currentQuestions.map((question) => (
                <div
                  key={question.id}
                  onClick={() => handleSelectQuestion(question)}
                  className={cn(
                    'group flex items-start gap-3 rounded-lg p-3 cursor-pointer transition-all',
                    selectedQuestion?.id === question.id
                      ? 'bg-primary/10 border border-primary/20'
                      : 'bg-muted/50 hover:bg-muted',
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {question.id}
                      </span>
                      <h3 className="truncate text-sm font-medium text-foreground">
                        {question.title}
                      </h3>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFillToEvaluation(question);
                    }}
                    className="opacity-0 group-hover:opacity-100 rounded-full bg-primary/10 p-1.5 text-primary transition-all hover:bg-primary hover:text-primary-foreground"
                    title="填充到代码评价"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* 分页 */}
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                第 {currentPage} / {totalPages} 页
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
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
                          'w-7 rounded-lg py-1 text-xs font-medium transition-colors',
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
                  className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧代码执行区 */}
        <div className="min-w-0 flex-1 space-y-5">
          {/* 题目详情 */}
          {selectedQuestion ? (
            <>
              <div className="rounded-xl bg-card p-5 shadow-card">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {selectedQuestion.id}
                    </span>
                    {selectedQuestion.title}
                  </h2>
                  <button
                    onClick={() => setShowHint(!showHint)}
                    className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted"
                  >
                    <Lightbulb className="h-3.5 w-3.5" />
                    {showHint ? '隐藏提示' : '显示提示'}
                  </button>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {selectedQuestion.content}
                </p>
                {showHint && (
                  <div className="mt-3 rounded-lg bg-accent-yellow/10 p-3">
                    <p className="text-sm leading-relaxed text-amber-700">
                      💡 {selectedQuestion.hint}
                    </p>
                  </div>
                )}
              </div>

              {/* 代码编辑器 */}
              <div className="rounded-xl bg-card p-5 shadow-card">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Terminal className="h-4 w-4 text-primary" />
                    Python 代码
                  </h3>
                  <div className="flex items-center gap-2">
                    {!showAnswer && (
                      <button
                        onClick={() => setShowPasswordModal(true)}
                        className="flex items-center gap-1 rounded-lg bg-accent-green/10 px-3 py-1.5 text-sm font-medium text-accent-green transition-colors hover:bg-accent-green hover:text-white"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        查看答案
                      </button>
                    )}
                    <button
                      onClick={handleFillCodeToEvaluation}
                      className="flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      填充到代码评价
                    </button>
                  </div>
                </div>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="# 在这里编写你的 Python 代码"
                  rows={8}
                  spellCheck={false}
                  className="w-full resize-none rounded-lg border-none bg-[#1E1E2E] px-4 py-3 font-mono text-sm leading-relaxed text-[#CDD6F4] placeholder:text-[#6C7086] focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <div className="mt-3 flex items-center justify-between">
                  <button
                    onClick={runCode}
                    disabled={isRunning}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all',
                      isRunning
                        ? 'bg-muted text-muted-foreground cursor-not-allowed'
                        : 'bg-primary text-primary-foreground hover:opacity-90',
                    )}
                  >
                    {isRunning ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                        运行中...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        执行代码
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 输入数据 */}
              <div className="rounded-xl bg-card p-5 shadow-card">
                <h3 className="mb-3 text-sm font-semibold text-foreground">输入数据</h3>
                <p className="mb-2 text-xs text-muted-foreground">
                  如果代码中使用了 input() 函数，请在此输入测试数据，每行一个输入值
                </p>
                <textarea
                  value={inputData}
                  onChange={(e) => setInputData(e.target.value)}
                  placeholder="输入1&#10;输入2&#10;输入3"
                  rows={3}
                  spellCheck={false}
                  className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* 输出结果 */}
              <div className="rounded-xl bg-card p-5 shadow-card">
                <h3 className="mb-3 text-sm font-semibold text-foreground">执行结果</h3>
                <div className="min-h-[150px] rounded-lg bg-[#1E1E2E] p-4 font-mono text-sm leading-relaxed text-[#CDD6F4] whitespace-pre-wrap break-all">
                  {output || '执行结果将在这里显示...'}
                </div>
              </div>
            </>
          ) : (
            <div className="flex min-h-[600px] flex-col items-center justify-center rounded-xl bg-card p-12 text-center shadow-card">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Terminal className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 text-base font-semibold text-foreground">
                请从左侧选择一道题目开始练习
              </h3>
              <p className="max-w-xs text-sm text-muted-foreground">
                选择题目后，右侧将显示题目详情和代码编辑区域
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 密码弹窗 */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-xl bg-card p-6 shadow-dialog w-full max-w-md mx-4">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">验证密码</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
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
              <p className="mt-2 text-sm text-destructive">{passwordError}</p>
            )}
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPassword('');
                  setPasswordError('');
                }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
              >
                取消
              </button>
              <button
                onClick={checkPassword}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
