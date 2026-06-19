'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Code2, MessageSquareCode, BarChart3, LogOut, User, ShieldCheck, Sparkles, Menu, X, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateSession, logout, type Student, type Admin } from '@/lib/auth';

/**
 * 导航菜单配置项
 */
const NAV_ITEMS = [
  {
    label: '试题演练',
    href: '/practice',
    icon: Code2,
  },
  {
    label: '代码评价',
    href: '/evaluate',
    icon: MessageSquareCode,
  },
  {
    label: 'AI解惑',
    href: '/chat',
    icon: Sparkles,
  },
  {
    label: '学情统计',
    href: '/statistics',
    icon: BarChart3,
  },
  {
    label: '学习资源',
    href: '/resources',
    icon: BookOpen,
  },
];

/**
 * Header组件
 * 
 * 页面顶部导航栏组件，包含：
 * - 应用Logo和名称
 * - 导航菜单（试题演练、代码评价、AI解惑、学情统计、学习资源）
 * - 用户信息显示和退出登录功能
 * - 移动端响应式菜单
 * 
 * @component
 * @author 码上成长项目组
 * @version 1.0.0
 */
export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<{ type: 'admin' | 'student'; user: Admin | Student } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /**
   * 路径变化时验证session状态
   * 
   * 监听路径变化，重新验证用户会话状态，更新当前用户信息。
   */
  useEffect(() => {
    const checkSession = async () => {
      const result = await validateSession();
      if (result.success && result.userType && result.user) {
        setCurrentUser({ type: result.userType, user: result.user });
      } else {
        setCurrentUser(null);
      }
    };
    checkSession();
  }, [pathname]);

  /**
   * 处理退出登录
   * 
   * 调用logout函数清除会话，并重定向到登录页面。
   */
  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    router.push('/login');
  };

  // 登录页和管理员后台不显示Header
  if (pathname === '/login' || pathname === '/admin' || pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-card/90 shadow-card backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo区域 */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-float">
            <Code2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-foreground sm:text-lg">码上成长</span>
            <span className="hidden rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground sm:inline-block">
              Python代码智能评价与学情诊断AI智能体
            </span>
          </div>
        </Link>

        {/* 桌面端导航 */}
        <div className="hidden items-center gap-4 md:flex">
          {/* 导航链接 */}
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* 用户信息和退出按钮 */}
          {currentUser && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5">
                {currentUser.type === 'admin' ? (
                  <ShieldCheck className="w-4 h-4 text-primary" />
                ) : (
                  <User className="w-4 h-4 text-primary" />
                )}
                <span className="text-sm font-medium text-foreground">
                  {currentUser.type === 'admin' 
                    ? '管理员' 
                    : (currentUser.user as Student).name}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <LogOut className="w-4 h-4" />
                退出
              </button>
            </div>
          )}
        </div>

        {/* 移动端菜单按钮 */}
        <button
          className="flex items-center justify-center rounded-lg p-2 text-muted-foreground md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* 移动端菜单 */}
      {mobileMenuOpen && (
        <div className="border-t border-border/40 bg-card md:hidden">
          <div className="space-y-1 px-4 py-3">
            {/* 导航链接 */}
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            
            {/* 用户信息和退出按钮 */}
            {currentUser && (
              <div className="mt-3 border-t border-border/40 pt-3">
                <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-3">
                  {currentUser.type === 'admin' ? (
                    <ShieldCheck className="w-4 h-4 text-primary" />
                  ) : (
                    <User className="w-4 h-4 text-primary" />
                  )}
                  <span className="text-sm font-medium text-foreground">
                    {currentUser.type === 'admin' 
                      ? '管理员' 
                      : (currentUser.user as Student).name}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="mt-2 flex items-center gap-2 w-full rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <LogOut className="w-4 h-4" />
                  退出登录
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}