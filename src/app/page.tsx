'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, User, Lock, GraduationCap, ShieldCheck } from 'lucide-react';
import { login, setSessionId, validateSession } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { Footer } from '@/components/footer';

export default function Home() {
  const router = useRouter();
  const [loginType, setLoginType] = useState<'admin' | 'student'>('student');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const result = await validateSession();
      if (result.success && result.userType) {
        if (result.userType === 'admin') {
          router.push('/admin');
        } else {
          router.push('/practice');
        }
        return;
      }
      setCheckingSession(false);
    };
    checkSession();
  }, [router]);

  const handleLogin = async () => {
    setError('');
    setLoading(true);

    if (!username.trim() || !password.trim()) {
      setError('请输入用户名和密码');
      setLoading(false);
      return;
    }

    try {
      const result = await login(loginType, username, password);
      if (result.success && result.sessionId) {
        setSessionId(result.sessionId);
        Promise.resolve().then(() => {
          if (loginType === 'admin') {
            router.push('/admin');
          } else {
            router.push('/evaluate');
          }
        });
      } else {
        setError(result.error || '登录失败，请检查账号密码');
      }
    } catch {
      setError('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1 flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent-green/5">
        <div className="w-full max-w-md mx-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
              <GraduationCap className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">码上成长</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Python代码智能评价与学情诊断AI智能体
            </p>
          </div>

          <div className="rounded-xl bg-card shadow-card p-6">
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setLoginType('student')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-medium transition-all',
                  loginType === 'student'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                <User className="w-4 h-4" />
                学生登录
              </button>
              <button
                onClick={() => setLoginType('admin')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-medium transition-all',
                  loginType === 'admin'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                <ShieldCheck className="w-4 h-4" />
                管理员登录
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {loginType === 'admin' ? '管理员账号' : '学号'}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={loginType === 'admin' ? '请输入管理员账号' : '请输入学号'}
                    className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  密码
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码"
                    className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
                  {error}
                </div>
              )}

              <button
                onClick={handleLogin}
                disabled={loading}
                className={cn(
                  'w-full flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition-all',
                  loading
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-primary text-primary-foreground hover:opacity-90'
                )}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                    登录中...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    登录
                  </>
                )}
              </button>
            </div>

            {loginType === 'student' && (
              <p className="mt-4 text-center text-xs text-muted-foreground">
                学生账号由管理员导入，请联系管理员获取
              </p>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}