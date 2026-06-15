'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Code2, MessageSquareCode, BarChart3, LogOut, User, ShieldCheck, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateSession, logout, type Student, type Admin } from '@/lib/auth';

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
];

/**
 * Header组件
 * 显示导航菜单和用户信息
 */
export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<{ type: 'admin' | 'student'; user: Admin | Student } | null>(null);

  /**
   * 路径变化时验证session状态
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
   */
  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (pathname === '/login' || pathname === '/admin' || pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-card/90 shadow-card backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-float">
            <Code2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-foreground">码上成长</span>
            <span className="hidden rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground sm:inline-block">
              Python代码智能评价与学情诊断AI智能体
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-4">
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
      </div>
    </header>
  );
}