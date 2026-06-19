'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  ExternalLink,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateSession, getLearningResources, type LearningResource } from '@/lib/auth';
import { ProtectedLayout } from '@/components/protected-layout';

/**
 * 学习资源页面
 *
 * 提供学习资源浏览功能：
 * - 展示所有学习资源链接
 * - 支持在页面内切换不同资源
 * - 提供资源描述和外部链接
 *
 * @page
 * @author 码上成长项目组
 * @version 1.0.0
 */
export default function ResourcesPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ type: 'student'; user: { studentId: string; name: string } } | null>(null);
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const checkSession = async () => {
      const result = await validateSession();
      if (!result.success || result.userType === 'admin') {
        router.push('/');
        return;
      }
      if (result.user && result.userType === 'student') {
        setCurrentUser({ type: 'student', user: result.user as { studentId: string; name: string } });
      }
      setPageLoading(false);
    };
    checkSession();
  }, [router]);

  useEffect(() => {
    const loadResources = async () => {
      setLoading(true);
      const data = await getLearningResources();
      setResources(data);
      setLoading(false);
    };
    if (!pageLoading) {
      loadResources();
    }
  }, [pageLoading]);

  // 切换到上一个资源
  const handlePrev = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : resources.length - 1));
  };

  // 切换到下一个资源
  const handleNext = () => {
    setActiveIndex((prev) => (prev < resources.length - 1 ? prev + 1 : 0));
  };

  // 直接选择某个资源
  const handleSelect = (index: number) => {
    setActiveIndex(index);
  };

  if (pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeResource = resources[activeIndex];

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-4 space-y-2 sm:mb-6 sm:space-y-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/statistics')}
              className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              返回
            </button>
          </div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">
            学习资源
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            精选优质Python学习资源，助力你的编程成长之路
          </p>
        </div>

        {loading && resources.length === 0 ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl bg-card p-8 text-center shadow-card sm:min-h-[600px] sm:p-12">
            <Loader2 className="mb-4 h-10 w-10 animate-spin text-primary sm:h-12 sm:w-12" />
            <h3 className="text-sm font-semibold text-foreground sm:text-base">
              加载中…
            </h3>
            <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
              正在获取学习资源
            </p>
          </div>
        ) : resources.length === 0 ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl bg-card p-8 text-center shadow-card sm:min-h-[600px] sm:p-12">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 sm:mb-5 sm:h-16 sm:w-16">
              <BookOpen className="h-6 w-6 text-primary sm:h-8 sm:w-8" />
            </div>
            <h3 className="mb-2 text-sm font-semibold text-foreground sm:text-base">
              暂无学习资源
            </h3>
            <p className="max-w-xs text-xs text-muted-foreground sm:text-sm">
              管理员尚未添加学习资源，请稍后再来
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col space-y-4">
              {/* 资源标签导航 */}
              <div className="rounded-xl bg-card p-3 shadow-card shrink-0">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <BookOpen className="h-4 w-4 text-primary" />
                  资源导航
                </h3>
                <span className="text-xs text-muted-foreground">
                  {activeIndex + 1} / {resources.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {resources.map((resource, index) => (
                  <button
                    key={resource.id}
                    onClick={() => handleSelect(index)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                      index === activeIndex
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                    )}
                  >
                    {resource.title}
                  </button>
                ))}
              </div>
            </div>

            {/* 内容区域 */}
            {activeResource && (
              <>
                {/* 资源信息栏 */}
                <div className="rounded-xl bg-card p-4 shadow-card sm:p-5 shrink-0">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-base font-bold text-foreground sm:text-lg">
                        {activeResource.title}
                      </h2>
                      {activeResource.description && (
                        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                          {activeResource.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handlePrev}
                        disabled={resources.length <= 1}
                        className="flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        上一个
                      </button>
                      <button
                        onClick={handleNext}
                        disabled={resources.length <= 1}
                        className="flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        下一个
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                      <a
                        href={activeResource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-all hover:opacity-90"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        新窗口打开
                      </a>
                    </div>
                  </div>
                </div>

                {/* iframe 内容区域 */}
                <div className="flex flex-col overflow-hidden rounded-xl bg-card shadow-card" style={{ height: '800px' }}>
                  <div className="flex h-10 items-center justify-between border-b border-border bg-muted/30 px-4 shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                      <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                      <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                    </div>
                    <span className="text-xs text-muted-foreground truncate max-w-[60%]">
                      {activeResource.url}
                    </span>
                    <a
                      href={activeResource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <div className="flex-1 overflow-auto">
                    <iframe
                      src={activeResource.url}
                      title={activeResource.title}
                      className="h-full w-full border-0"
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                      loading="lazy"
                      scrolling="yes"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 提示信息 */}
          {!loading && resources.length > 0 && (
            <div className="rounded-xl bg-accent-yellow/10 p-4 sm:p-5">
              <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                <span className="font-medium text-foreground">温馨提示：</span>
                如果页面无法正常加载，请点击「新窗口打开」在新的浏览器标签页中查看。部分网站可能需要登录才能完整访问全部内容。
              </p>
            </div>
          )}
          </>
        )}
      </div>
    </ProtectedLayout>
  );
}
