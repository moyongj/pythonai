'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  LogOut,
  ShieldCheck,
  BookOpen,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  ExternalLink,
  Users,
  FileText,
  BarChart3,
  TrendingUp,
  Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  validateSession,
  logout,
  getLearningResources,
  addLearningResource,
  updateLearningResource,
  deleteLearningResource,
  type LearningResource,
} from '@/lib/auth';

/**
 * 标签页类型枚举
 */
type TabType = 'resources' | 'students' | 'questions' | 'evaluations';

/**
 * 管理员学习资源管理页面
 *
 * 提供学习资源管理功能：
 * - 查看所有学习资源
 * - 添加新的学习资源
 * - 编辑现有资源
 * - 删除资源
 *
 * @page
 * @author MYJ
 * @version 1.0.0
 */
export default function AdminResourcesPage() {
  const router = useRouter();
  const getInitialTab = (): TabType => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab') as TabType;
      if (tab && ['resources', 'students', 'questions', 'evaluations'].includes(tab)) {
        return tab;
      }
    }
    return 'resources';
  };

  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [editData, setEditData] = useState<{ title: string; url: string; description: string }>({
    title: '',
    url: '',
    description: '',
  });
  const [newResource, setNewResource] = useState({ title: '', url: '', description: '' });
  const [showAddForm, setShowAddForm] = useState(false);

  // 加载资源数据
  const loadResources = async () => {
    const data = await getLearningResources();
    setResources(data);
  };

  // 页面初始化
  useEffect(() => {
    const initPage = async () => {
      const result = await validateSession();
      if (!result.success || result.userType !== 'admin') {
        router.push('/login');
        return;
      }
      await loadResources();
      setLoading(false);
    };
    initPage();
  }, [router]);

  // 切换标签页时更新URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', activeTab);
      window.history.pushState({}, '', url.toString());
    }
  }, [activeTab]);

  // 处理退出登录
  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // 开始编辑
  const handleStartEdit = (resource: LearningResource) => {
    setEditingItem(resource.id);
    setEditData({
      title: resource.title,
      url: resource.url,
      description: resource.description || '',
    });
  };

  // 保存编辑
  const handleSaveEdit = async (id: number) => {
    const success = await updateLearningResource(id, editData);
    if (success) {
      setEditingItem(null);
      setEditData({ title: '', url: '', description: '' });
      await loadResources();
    } else {
      alert('更新失败');
    }
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditData({ title: '', url: '', description: '' });
  };

  // 删除资源
  const handleDelete = async (id: number) => {
    if (confirm('确定要删除该学习资源吗？')) {
      const success = await deleteLearningResource(id);
      if (success) {
        await loadResources();
      } else {
        alert('删除失败');
      }
    }
  };

  // 添加新资源
  const handleAdd = async () => {
    if (!newResource.title.trim() || !newResource.url.trim()) {
      alert('请填写资源标题和链接');
      return;
    }
    const result = await addLearningResource(newResource);
    if (result) {
      setNewResource({ title: '', url: '', description: '' });
      setShowAddForm(false);
      await loadResources();
    } else {
      alert('添加失败');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-8 h-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary sm:w-6 sm:h-6" />
              <span className="text-base font-bold text-foreground sm:text-lg">管理员后台</span>
            </div>
            <nav className="hidden md:flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => router.push('/admin?tab=students')}
                className={cn(
                  'flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors sm:px-3 sm:text-sm',
                  'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                学生管理
              </button>
              <button
                onClick={() => router.push('/admin?tab=questions')}
                className={cn(
                  'flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors sm:px-3 sm:text-sm',
                  'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                题库管理
              </button>
              <button
                onClick={() => router.push('/admin?tab=evaluations')}
                className={cn(
                  'flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors sm:px-3 sm:text-sm',
                  'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                学情记录
              </button>
              <a
                href="/admin/statistics"
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:px-3 sm:text-sm"
              >
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                学情分析
              </a>
              <button
                onClick={() => router.push('/admin/resources')}
                className={cn(
                  'flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors sm:px-3 sm:text-sm',
                  'bg-primary text-primary-foreground'
                )}
              >
                <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                学习资源
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="flex items-center justify-center rounded-lg p-2 text-muted-foreground md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:px-3 sm:py-2 sm:text-sm"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              退出
            </button>
          </div>
        </div>
        {/* 移动端导航菜单 */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-border bg-card px-4 py-2 space-y-1">
            <button
              onClick={() => { router.push('/admin?tab=students'); setMobileMenuOpen(false); }}
              className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
            >
              <Users className="w-4 h-4" />
              学生管理
            </button>
            <button
              onClick={() => { router.push('/admin?tab=questions'); setMobileMenuOpen(false); }}
              className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
            >
              <FileText className="w-4 h-4" />
              题库管理
            </button>
            <button
              onClick={() => { router.push('/admin?tab=evaluations'); setMobileMenuOpen(false); }}
              className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
            >
              <BarChart3 className="w-4 h-4" />
              学情记录
            </button>
            <a
              href="/admin/statistics"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
            >
              <TrendingUp className="w-4 h-4" />
              学情分析
            </a>
            <button
              onClick={() => { router.push('/admin/resources'); setMobileMenuOpen(false); }}
              className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm font-medium text-primary bg-primary/10"
            >
              <BookOpen className="w-4 h-4" />
              学习资源
            </button>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-lg font-bold text-foreground sm:text-xl">学习资源管理</h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            管理学生端的学习资源链接，设置完成后学生会看到更新后的资源列表
          </p>
        </div>

        {/* 操作按钮 */}
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-float transition-all hover:opacity-90"
          >
            <Plus className="w-4 h-4" />
            添加资源
          </button>
        </div>

        {/* 添加表单 */}
        {showAddForm && (
          <div className="mb-6 rounded-xl bg-card p-4 shadow-card sm:p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">添加新资源</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground sm:text-sm">
                  资源标题 *
                </label>
                <input
                  type="text"
                  value={newResource.title}
                  onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                  placeholder="例如：Python基础教程"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground sm:text-sm">
                  资源链接 *
                </label>
                <input
                  type="url"
                  value={newResource.url}
                  onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
                  placeholder="https://..."
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground sm:text-sm">
                  资源描述
                </label>
                <input
                  type="text"
                  value={newResource.description}
                  onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                  placeholder="简要描述这个资源的内容"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleAdd}
                  className="inline-flex items-center gap-1 rounded-lg bg-accent-green px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-green/90"
                >
                  <Save className="w-4 h-4" />
                  保存
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewResource({ title: '', url: '', description: '' });
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-muted px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/80"
                >
                  <X className="w-4 h-4" />
                  取消
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 资源列表 */}
        {resources.length === 0 ? (
          <div className="rounded-xl bg-card p-8 text-center shadow-card">
            <div className="mb-4 flex justify-center">
              <BookOpen className="h-12 w-12 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">暂无学习资源，点击上方按钮添加</p>
          </div>
        ) : (
          <div className="space-y-3">
            {resources.map((resource) => (
              <div key={resource.id} className="rounded-xl bg-card p-4 shadow-card sm:p-5">
                {editingItem === resource.id ? (
                  // 编辑模式
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-foreground">
                        资源标题
                      </label>
                      <input
                        type="text"
                        value={editData.title}
                        onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-foreground">
                        资源链接
                      </label>
                      <input
                        type="url"
                        value={editData.url}
                        onChange={(e) => setEditData({ ...editData, url: e.target.value })}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-foreground">
                        资源描述
                      </label>
                      <input
                        type="text"
                        value={editData.description}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(resource.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-accent-green px-3 py-1.5 text-sm font-medium text-white"
                      >
                        <Save className="w-3.5 h-3.5" />
                        保存
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="inline-flex items-center gap-1 rounded-lg bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground"
                      >
                        <X className="w-3.5 h-3.5" />
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  // 展示模式
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            #{resource.id}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-foreground sm:text-base">
                          {resource.title}
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground truncate max-w-lg">
                          {resource.url}
                        </p>
                        {resource.description && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {resource.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="预览"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleStartEdit(resource)}
                          className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="编辑"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(resource.id)}
                          className="rounded p-1.5 text-destructive hover:bg-destructive/10"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 提示信息 */}
        <div className="mt-6 rounded-xl bg-primary/5 p-4 sm:p-5">
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <BookOpen className="h-4 w-4 text-primary" />
            温馨提示
          </h3>
          <ul className="space-y-1 text-xs text-muted-foreground sm:text-sm">
            <li>• 学习资源会同步显示在学生端的学习资源页面</li>
            <li>• 建议使用稳定的外部链接，确保学生能够正常访问</li>
            <li>• 支持添加任何公开可访问的网页链接</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
