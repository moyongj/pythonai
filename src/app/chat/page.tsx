'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import {
  Plus,
  Send,
  Trash2,
  MessageSquare,
  Sparkles,
  FileQuestion,
  Code2,
  Bug,
  Lightbulb,
  Loader2,
  User as UserIcon,
  Bot,
  Edit2,
  Check,
  X,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateSession, type Student, getSessionId } from '@/lib/auth';
import { ProtectedLayout } from '@/components/protected-layout';

/**
 * 会话信息接口
 */
interface Conversation {
  id: number;
  conversationId: string;
  studentId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 消息信息接口
 */
interface Message {
  id: number;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

/**
 * 模板类型枚举
 */
type TemplateKey = 'analyze' | 'explain' | 'debug' | 'algorithm';

/**
 * AI提示词模板配置
 * 
 * 提供四种预设模板，帮助学生快速构建问题：
 * - analyze: 题目分析与知识点解析
 * - explain: 代码解释与注释
 * - debug: 调试帮助与错误分析
 * - algorithm: 算法思路引导
 */
const TEMPLATES: Array<{
  key: TemplateKey;
  name: string;
  icon: typeof FileQuestion;
  description: string;
  fields: Array<{ key: string; label: string; placeholder: string; multiline?: boolean }>;
}> = [
  {
    key: 'analyze',
    name: '题目分析与知识点解析',
    icon: FileQuestion,
    description: '分析题目考察的知识点和解题思路',
    fields: [
      { key: 'question', label: '题目内容', placeholder: '请粘贴完整的题目要求...', multiline: true },
    ],
  },
  {
    key: 'explain',
    name: '代码解释与注释',
    icon: Code2,
    description: '逐行解释代码的作用和原理',
    fields: [
      { key: 'code', label: 'Python 代码', placeholder: '请粘贴需要解释的代码...', multiline: true },
    ],
  },
  {
    key: 'debug',
    name: '调试帮助与错误分析',
    icon: Bug,
    description: '分析错误原因并提供调试思路',
    fields: [
      { key: 'code', label: '有问题的代码', placeholder: '请粘贴出问题的代码...', multiline: true },
      { key: 'error', label: '错误信息', placeholder: '请粘贴完整的错误信息...', multiline: true },
    ],
  },
  {
    key: 'algorithm',
    name: '算法思路引导',
    icon: Lightbulb,
    description: '拆解问题并提供算法思路',
    fields: [
      { key: 'question', label: '问题描述', placeholder: '请描述需要解决的问题...', multiline: true },
    ],
  },
];

/**
 * AI解惑页面
 * 
 * 仿DeepSeek布局设计，包含：
 * - 左侧：会话列表，支持创建、删除、重命名会话
 * - 右侧：对话区域，支持实时消息交互
 * - 四种提示词模板：题目分析、代码解释、调试帮助、算法引导
 * - Markdown渲染支持，含代码高亮
 * 
 * @page
 * @author 码上成长项目组
 * @version 1.0.0
 */
export default function ChatPage() {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [currentUser, setCurrentUser] = useState<Student | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<TemplateKey | null>(null);
  const [templateVars, setTemplateVars] = useState<Record<string, string>>({});
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, []);

  /**
   * 验证session
   */
  useEffect(() => {
    const checkSession = async () => {
      const result = await validateSession();
      if (!result.success || result.userType === 'admin') {
        router.push('/login');
        return;
      }
      if (result.user && result.userType === 'student') {
        setCurrentUser(result.user as Student);
      }
      setPageLoading(false);
    };
    checkSession();
  }, [router]);

  /**
   * 加载会话列表
   */
  const loadConversations = useCallback(async (studentId: string) => {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list', studentId }),
      });
      const data = await res.json();
      if (data.success) {
        setConversations(data.conversations);
      }
    } catch (err) {
      console.error('加载会话列表失败', err);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadConversations(currentUser.studentId);
    }
  }, [currentUser, loadConversations]);

  /**
   * 加载会话消息
   */
  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get', conversationId }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
        // 滚动到底部
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (err) {
      console.error('加载消息失败', err);
    }
  }, []);

  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
    } else {
      setMessages([]);
    }
  }, [activeConversationId, loadMessages]);

  /**
   * 创建新会话
   */
  const handleNewConversation = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          studentId: currentUser.studentId,
          title: '新对话',
        }),
      });
      const data = await res.json();
      if (data.success) {
        await loadConversations(currentUser.studentId);
        setActiveConversationId(data.conversation.conversationId);
      }
    } catch (err) {
      console.error('创建会话失败', err);
    }
  };

  /**
   * 删除会话
   */
  const handleDeleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('确定要删除这个对话吗？')) return;
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', conversationId }),
      });
      const data = await res.json();
      if (data.success) {
        if (currentUser) {
          await loadConversations(currentUser.studentId);
        }
        if (activeConversationId === conversationId) {
          setActiveConversationId(null);
        }
      }
    } catch (err) {
      console.error('删除会话失败', err);
    }
  };

  /**
   * 重命名会话
   */
  const handleRenameConversation = async (conversationId: string) => {
    if (!editingTitle.trim()) return;
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rename',
          conversationId,
          title: editingTitle.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (currentUser) {
          await loadConversations(currentUser.studentId);
        }
      }
    } catch (err) {
      console.error('重命名失败', err);
    } finally {
      setEditingTitleId(null);
      setEditingTitle('');
    }
  };

  /**
   * 发送消息
   */
  const handleSend = async () => {
    if (!input.trim() || !activeConversationId || loading) return;
    const userMsg = input.trim();
    setInput('');
    setLoading(true);

    // 乐观更新UI
    const tempUserMessage: Message = {
      id: Date.now(),
      conversationId: activeConversationId,
      role: 'user',
      content: userMsg,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          conversationId: activeConversationId,
          message: userMsg,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [...prev, data.message]);
        if (data.titleUpdated && currentUser) {
          await loadConversations(currentUser.studentId);
        }
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        alert('发送失败：' + (data.error || '未知错误'));
      }
    } catch (err) {
      alert('发送失败：' + (err instanceof Error ? err.message : '网络错误'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * 使用模板发送
   */
  const handleUseTemplate = async () => {
    if (!activeTemplate || !currentUser) return;
    let conversationId = activeConversationId;
    if (!conversationId) {
      // 自动创建新会话
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create',
            studentId: currentUser.studentId,
            title: '新对话',
          }),
        });
        const data = await res.json();
        if (data.success) {
          conversationId = data.conversation.conversationId;
          setActiveConversationId(conversationId);
          await loadConversations(currentUser.studentId);
        }
      } catch (err) {
        alert('创建会话失败');
        return;
      }
    }

    if (!conversationId) return;
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          conversationId,
          template: activeTemplate,
          templateVars,
        }),
      });
      const data = await res.json();
      if (data.success) {
        await loadMessages(conversationId);
        if (data.titleUpdated && currentUser) {
          await loadConversations(currentUser.studentId);
        }
        setShowTemplateModal(false);
        setActiveTemplate(null);
        setTemplateVars({});
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        alert('发送失败：' + (data.error || '未知错误'));
      }
    } catch (err) {
      alert('发送失败：' + (err instanceof Error ? err.message : '网络错误'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * 渲染Markdown（使用ReactMarkdown）
   */
  const renderMessage = (content: string) => {
    const customComponents = {
      h1: ({ children }: { children?: React.ReactNode }) => (
        <h1 className="text-xl font-bold text-foreground mb-3 mt-4">{children}</h1>
      ),
      h2: ({ children }: { children?: React.ReactNode }) => (
        <h2 className="text-lg font-semibold text-foreground mb-2 mt-3">{children}</h2>
      ),
      h3: ({ children }: { children?: React.ReactNode }) => (
        <h3 className="text-base font-semibold text-foreground mb-2 mt-2">{children}</h3>
      ),
      h4: ({ children }: { children?: React.ReactNode }) => (
        <h4 className="text-sm font-semibold text-foreground mb-1 mt-1">{children}</h4>
      ),
      p: ({ children }: { children?: React.ReactNode }) => (
        <p className="text-sm text-foreground mb-2 leading-relaxed">{children}</p>
      ),
      ul: ({ children }: { children?: React.ReactNode }) => (
        <ul className="list-disc list-inside text-sm text-foreground mb-2 space-y-1 pl-2">
          {children}
        </ul>
      ),
      ol: ({ children }: { children?: React.ReactNode }) => (
        <ol className="list-decimal list-inside text-sm text-foreground mb-2 space-y-1 pl-2">
          {children}
        </ol>
      ),
      li: ({ children }: { children?: React.ReactNode }) => (
        <li className="text-sm text-foreground">{children}</li>
      ),
      strong: ({ children }: { children?: React.ReactNode }) => (
        <strong className="font-bold text-foreground">{children}</strong>
      ),
      em: ({ children }: { children?: React.ReactNode }) => (
        <em className="italic text-foreground">{children}</em>
      ),
      code: ({ className, children }: { className?: string; children?: React.ReactNode }) => {
        const isBlock = className?.includes('language-');
        if (isBlock) {
          return (
            <pre className="rounded-lg bg-[#1E1E2E] px-4 py-3 text-sm font-mono text-[#CDD6F4] overflow-x-auto mb-3 mt-2">
              <code>{children}</code>
            </pre>
          );
        }
        return (
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">
            {children}
          </code>
        );
      },
      blockquote: ({ children }: { children?: React.ReactNode }) => (
        <blockquote className="border-l-2 border-primary pl-3 py-1 text-sm text-muted-foreground italic my-3">
          {children}
        </blockquote>
      ),
      hr: () => <hr className="border-border my-4" />,
      a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
        <a
          href={href}
          className="text-primary underline underline-offset-2 hover:text-primary/80"
          target="_blank"
          rel="noopener noreferrer"
        >
          {children}
        </a>
      ),
      table: ({ children }: { children?: React.ReactNode }) => (
        <div className="overflow-x-auto my-3">
          <table className="w-full text-sm border-collapse">
            {children}
          </table>
        </div>
      ),
      th: ({ children }: { children?: React.ReactNode }) => (
        <th className="border border-border px-3 py-2 bg-muted text-left font-semibold">
          {children}
        </th>
      ),
      td: ({ children }: { children?: React.ReactNode }) => (
        <td className="border border-border px-3 py-2">{children}</td>
      ),
    };

    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={customComponents}
      >
        {content}
      </ReactMarkdown>
    );
  };

  if (pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ProtectedLayout>
      <div className="flex h-[calc(100vh-4rem)] flex-col bg-background lg:flex-row">
      {/* 左侧会话列表 - 桌面端 */}
      <div
        className={cn(
          'hidden lg:flex-shrink-0 lg:border-r lg:border-border lg:bg-card lg:transition-all lg:duration-300',
          sidebarOpen ? 'lg:w-72' : 'lg:w-0'
        )}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-border p-3">
            <button
              onClick={handleNewConversation}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              新建对话
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="mb-2 h-8 w-8 text-muted-foreground/50" />
                <p className="text-xs text-muted-foreground">还没有对话记录</p>
                <p className="mt-1 text-xs text-muted-foreground">点击"新建对话"开始</p>
              </div>
            ) : (
              <div className="space-y-1">
                {conversations.map((conv) => (
                  <div
                    key={conv.conversationId}
                    onClick={() => setActiveConversationId(conv.conversationId)}
                    className={cn(
                      'group flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 transition-all',
                      activeConversationId === conv.conversationId
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground hover:bg-muted'
                    )}
                  >
                    <MessageSquare className="h-4 w-4 flex-shrink-0" />
                    {editingTitleId === conv.conversationId ? (
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleRenameConversation(conv.conversationId);
                          } else if (e.key === 'Escape') {
                            setEditingTitleId(null);
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 rounded border border-border bg-background px-1 text-sm"
                        autoFocus
                      />
                    ) : (
                      <span className="flex-1 truncate text-sm">{conv.title}</span>
                    )}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                      {editingTitleId === conv.conversationId ? (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRenameConversation(conv.conversationId);
                            }}
                            className="rounded p-1 hover:bg-accent"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTitleId(null);
                            }}
                            className="rounded p-1 hover:bg-accent"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTitleId(conv.conversationId);
                              setEditingTitle(conv.title);
                            }}
                            className="rounded p-1 hover:bg-accent"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteConversation(conv.conversationId, e)}
                            className="rounded p-1 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 移动端侧边栏按钮 */}
      <button
        onClick={() => setSidebarOpen(true)}
        className={`fixed bottom-20 left-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg lg:hidden transition-all ${sidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        <MessageSquare className="h-5 w-5" />
      </button>

      {/* 移动端侧边栏遮罩 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 移动端侧边栏 */}
      <div
        className={cn(
          'fixed left-0 top-0 z-50 h-full w-72 transform border-r border-border bg-card transition-transform duration-300 lg:hidden',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border p-4">
            <h2 className="text-sm font-semibold text-foreground">对话列表</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded p-1 hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="border-b border-border p-3">
            <button
              onClick={() => {
                handleNewConversation();
                setSidebarOpen(false);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              新建对话
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="mb-2 h-8 w-8 text-muted-foreground/50" />
                <p className="text-xs text-muted-foreground">还没有对话记录</p>
                <p className="mt-1 text-xs text-muted-foreground">点击"新建对话"开始</p>
              </div>
            ) : (
              <div className="space-y-1">
                {conversations.map((conv) => (
                  <div
                    key={conv.conversationId}
                    onClick={() => {
                      setActiveConversationId(conv.conversationId);
                      setSidebarOpen(false);
                    }}
                    className={cn(
                      'group flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 transition-all',
                      activeConversationId === conv.conversationId
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground hover:bg-muted'
                    )}
                  >
                    <MessageSquare className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-1 truncate text-sm">{conv.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 右侧对话区 */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* 顶部工具栏 */}
        <div className="flex items-center justify-between border-b border-border bg-card px-3 py-2 sm:px-4 sm:py-2.5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded p-1.5 hover:bg-muted lg:hidden"
            >
              <ChevronLeft
                className={cn('h-4 w-4 transition-transform', !sidebarOpen && 'rotate-180')}
              />
            </button>
            <h2 className="text-sm font-semibold text-foreground">
              {activeConversationId
                ? conversations.find((c) => c.conversationId === activeConversationId)?.title || 'AI 解惑'
                : 'AI 解惑'}
            </h2>
          </div>
          <div className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>DeepSeek</span>
          </div>
        </div>

        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center p-4 sm:p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 sm:h-16 sm:w-16">
                <Sparkles className="h-6 w-6 text-primary sm:h-8 sm:w-8" />
              </div>
              <h3 className="mb-2 text-base font-semibold text-foreground sm:text-lg">
                AI 解惑助手
              </h3>
              <p className="mb-4 max-w-sm text-center text-sm text-muted-foreground sm:mb-6 sm:max-w-md">
                专注于 Python 学习辅导，引导式教学，不直接给答案
              </p>
              <div className="grid grid-cols-1 gap-2 w-full max-w-xs sm:grid-cols-2 sm:gap-3 sm:max-w-lg md:grid-cols-4">
                {TEMPLATES.map((tpl) => {
                  const Icon = tpl.icon;
                  return (
                    <button
                      key={tpl.key}
                      onClick={() => {
                        setActiveTemplate(tpl.key);
                        setShowTemplateModal(true);
                        setTemplateVars({});
                      }}
                      className="flex flex-col items-start gap-2 rounded-lg border border-border bg-card p-3 text-left transition-all hover:border-primary/30 hover:bg-primary/5 sm:p-4"
                    >
                      <Icon className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">{tpl.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{tpl.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-2 p-2 sm:space-y-3 sm:p-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'flex gap-1.5 sm:gap-2 md:gap-3',
                    msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full sm:h-7 sm:w-7 md:h-8 md:w-8',
                      msg.role === 'user' ? 'bg-primary/10' : 'bg-accent-pink/10'
                    )}
                  >
                    {msg.role === 'user' ? (
                      <UserIcon className="h-3 w-3 text-primary sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                    ) : (
                      <Bot className="h-3 w-3 text-accent-pink sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                    )}
                  </div>
                  <div
                    className={cn(
                      'min-w-0 flex-1 rounded-lg px-2.5 py-2 text-xs leading-relaxed sm:rounded-xl sm:px-3 sm:py-2.5 md:rounded-2xl md:px-4 md:py-3 md:text-sm',
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card text-foreground shadow-sm border border-border'
                    )}
                  >
                    {msg.role === 'user' ? (
                      <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                    ) : (
                      <div className="prose prose-xs max-w-none text-foreground sm:prose-sm">
                        {renderMessage(msg.content)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-1.5 sm:gap-2 md:gap-3">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent-pink/10 sm:h-7 sm:w-7 md:h-8 md:w-8">
                    <Bot className="h-3 w-3 text-accent-pink sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                  </div>
                  <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-2 text-xs text-muted-foreground sm:rounded-xl sm:px-3 sm:py-2.5 md:rounded-2xl md:px-4 md:py-3 md:text-sm">
                    <Loader2 className="h-3 w-3 animate-spin sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                    AI 正在思考...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* 输入区 */}
        <div className="border-t border-border bg-card px-2 py-3 sm:px-3 sm:py-4">
          <div className="mx-auto max-w-3xl">
            {activeConversationId || conversations.length > 0 ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setShowTemplateModal(true);
                    }}
                    className="flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/80 sm:px-3"
                  >
                    <Sparkles className="h-3 w-3" />
                    使用提示词模板
                  </button>
                </div>
                <div className="flex items-end gap-1.5 rounded-lg border border-border bg-background p-1.5 sm:rounded-xl sm:p-2 md:rounded-2xl">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder={
                      activeConversationId
                        ? '输入你的问题...'
                        : '点击左侧"新建对话"开始 AI 解惑'
                    }
                    rows={1}
                    disabled={!activeConversationId || loading}
                    className="min-h-[32px] flex-1 resize-none border-0 bg-transparent px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50 sm:min-h-[36px] sm:px-2.5 sm:py-2 md:min-h-[40px] md:text-sm"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || !activeConversationId || loading}
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:h-9 sm:w-9"
                  >
                    <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <button
                  onClick={handleNewConversation}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 sm:px-6 sm:py-3"
                >
                  <Plus className="h-4 w-4" />
                  开始新的对话
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 模板弹窗 */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md mx-4 rounded-xl bg-card p-4 shadow-dialog sm:max-w-2xl sm:p-6 max-h-[90vh] overflow-y-auto">
            {/* 模板选择阶段 */}
            {!activeTemplate ? (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-foreground">选择提示词模板</h3>
                  <button
                    onClick={() => {
                      setShowTemplateModal(false);
                      setActiveTemplate(null);
                      setTemplateVars({});
                    }}
                    className="rounded p-1 hover:bg-muted"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                  {TEMPLATES.map((tpl) => {
                    const Icon = tpl.icon;
                    return (
                      <button
                        key={tpl.key}
                        onClick={() => {
                          setActiveTemplate(tpl.key);
                          setTemplateVars({});
                        }}
                        className="flex flex-col items-start gap-2 rounded-lg border border-border bg-background p-3 text-left transition-all hover:border-primary/30 hover:bg-primary/5 sm:p-4"
                      >
                        <Icon className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm font-semibold text-foreground">{tpl.name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{tpl.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              /* 模板表单阶段 */
              <>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setActiveTemplate(null);
                        setTemplateVars({});
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted hover:bg-muted/80"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    {(() => {
                      const tpl = TEMPLATES.find((t) => t.key === activeTemplate);
                      if (!tpl) return null;
                      const Icon = tpl.icon;
                      return (
                        <>
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-base font-semibold text-foreground">
                              {tpl.name}
                            </h3>
                            <p className="text-xs text-muted-foreground">{tpl.description}</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  <button
                    onClick={() => {
                      setShowTemplateModal(false);
                      setActiveTemplate(null);
                      setTemplateVars({});
                    }}
                    className="rounded p-1 hover:bg-muted"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  {TEMPLATES.find((t) => t.key === activeTemplate)?.fields.map((field) => (
                    <div key={field.key}>
                      <label className="mb-1.5 block text-sm font-medium text-foreground">
                        {field.label}
                      </label>
                      <textarea
                        value={templateVars[field.key] || ''}
                        onChange={(e) =>
                          setTemplateVars((prev) => ({
                            ...prev,
                            [field.key]: e.target.value,
                          }))
                        }
                        placeholder={field.placeholder}
                        rows={field.multiline ? 4 : 2}
                        className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      setShowTemplateModal(false);
                      setActiveTemplate(null);
                      setTemplateVars({});
                    }}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleUseTemplate}
                    disabled={loading}
                    className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        发送中...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        发送给 AI
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
    </ProtectedLayout>
  );
}