'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { 
  LogOut, Users, FileText, BarChart3, Upload, Plus, Trash2, Edit, 
  Save, X, Search, Download, ChevronLeft, ChevronRight, ShieldCheck, TrendingUp, BookOpen, Menu
} from 'lucide-react';
import {
  validateSession,
  logout,
  getStudents,
  addStudents,
  updateStudent,
  deleteStudent,
  getEvaluations,
  deleteEvaluation,
  getQuestions,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  type Student,
  type EvaluationRecord,
  type QuestionItem,
} from '@/lib/auth';
import { cn } from '@/lib/utils';
import { Footer } from '@/components/footer';

/**
 * 标签页类型枚举
 */
type TabType = 'students' | 'questions' | 'evaluations';

/**
 * 管理员后台页面
 * 
 * 提供完整的后台管理功能，包含：
 * - 学生管理：批量导入（Excel）、编辑、删除学生信息
 * - 题库管理：添加、编辑、删除练习题
 * - 学情记录：查看所有学生的评价记录
 * - 数据统计：班级级别数据统计分析
 * 
 * @page
 * @author MYJ
 * @version 1.0.0
 */
export default function AdminPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const getInitialTab = (): TabType => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab') as TabType;
      if (tab && ['students', 'questions', 'evaluations'].includes(tab)) {
        return tab;
      }
    }
    return 'students';
  };

  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluationRecord[]>([]);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState<string | number | null>(null);
  const [editData, setEditData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [studentCurrentPage, setStudentCurrentPage] = useState(1);
  const [studentTotalPages, setStudentTotalPages] = useState(1);
  
  const [newQuestion, setNewQuestion] = useState({
    title: '',
    content: '',
    hint: '',
    exampleCode: '',
  });

  /**
   * 页面初始化时验证session并加载数据
   */
  useEffect(() => {
    const initPage = async () => {
      const result = await validateSession();
      if (!result.success || result.userType !== 'admin') {
        router.push('/login');
        return;
      }
      await loadData();
      setLoading(false);
    };
    initPage();
  }, [router]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab') as TabType;
      if (tab && ['students', 'questions', 'evaluations'].includes(tab) && tab !== activeTab) {
        setActiveTab(tab);
      }
    }
  }, [router]);

  /**
   * 加载所有数据（学生、学情记录、题目）
   */
  const loadData = async () => {
    const [studentsData, evaluationsData, questionsData] = await Promise.all([
      getStudents(),
      getEvaluations(),
      getQuestions(),
    ]);
    setStudents(studentsData);
    setEvaluations(evaluationsData);
    setQuestions(questionsData);
    setStudentTotalPages(Math.ceil(studentsData.length / 10));
    setStudentCurrentPage(1);
  };

  /**
   * 处理退出登录
   */
  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  /**
   * 处理Excel文件上传导入学生
   */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];

        const studentList = jsonData.map((row) => ({
          class: String(row['班级'] || row['class'] || ''),
          name: String(row['学生姓名'] || row['name'] || row['姓名'] || ''),
          studentId: String(row['学号'] || row['studentId'] || row['id'] || ''),
          password: String(row['密码'] || row['password'] || '123456'),
        })).filter(s => s.studentId && s.name);

        if (studentList.length > 0) {
          const result = await addStudents(studentList);
          if (result.success) {
            await loadData();
            alert(`成功导入 ${result.count || studentList.length} 名学生`);
          } else {
            alert(result.error || '导入失败');
          }
        } else {
          alert('Excel文件中没有找到有效的学生数据');
        }
      } catch {
        alert('Excel文件解析失败，请检查文件格式');
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * 删除学生
   */
  const handleDeleteStudent = async (id: number) => {
    if (confirm('确定要删除该学生吗？')) {
      const success = await deleteStudent(id);
      if (success) {
        await loadData();
      } else {
        alert('删除失败');
      }
    }
  };

  /**
   * 开始编辑学生信息
   */
  const handleStartEditStudent = (student: Student) => {
    setEditingItem(student.id);
    setEditData({
      class: student.class,
      name: student.name,
      studentId: student.studentId,
      password: '',
    });
  };

  /**
   * 保存编辑的学生信息
   */
  const handleSaveEditStudent = async (id: number) => {
    const success = await updateStudent(id, {
      class: editData.class,
      name: editData.name,
      studentId: editData.studentId,
      password: editData.password || undefined,
    });
    if (success) {
      setEditingItem(null);
      setEditData({});
      await loadData();
    } else {
      alert('更新失败');
    }
  };

  /**
   * 删除学情记录
   */
  const handleDeleteEvaluation = async (id: number) => {
    if (confirm('确定要删除该学情记录吗？')) {
      const success = await deleteEvaluation(id);
      if (success) {
        await loadData();
      } else {
        alert('删除失败');
      }
    }
  };

  /**
   * 添加新题目
   */
  const handleAddQuestion = async () => {
    if (!newQuestion.title || !newQuestion.content) {
      alert('请填写题目标题和内容');
      return;
    }
    const result = await addQuestion(newQuestion);
    if (result) {
      setNewQuestion({ title: '', content: '', hint: '', exampleCode: '' });
      await loadData();
    } else {
      alert('添加失败');
    }
  };

  /**
   * 删除题目
   */
  const handleDeleteQuestion = async (id: number) => {
    if (confirm('确定要删除该题目吗？')) {
      const success = await deleteQuestion(id);
      if (success) {
        await loadData();
      } else {
        alert('删除失败');
      }
    }
  };

  /**
   * 开始编辑题目
   */
  const handleStartEditQuestion = (question: QuestionItem) => {
    setEditingItem(question.id);
    setEditData({
      title: question.title,
      content: question.content,
      hint: question.hint,
      exampleCode: question.exampleCode,
    });
  };

  /**
   * 保存编辑的题目
   */
  const handleSaveEditQuestion = async (id: number) => {
    const success = await updateQuestion(id, {
      title: editData.title,
      content: editData.content,
      hint: editData.hint,
      exampleCode: editData.exampleCode,
    });
    if (success) {
      setEditingItem(null);
      setEditData({});
      await loadData();
    } else {
      alert('更新失败');
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.includes(searchQuery) || 
    s.studentId.includes(searchQuery) || 
    s.class.includes(searchQuery)
  );

  const paginatedStudents = filteredStudents.slice(
    (studentCurrentPage - 1) * 10,
    studentCurrentPage * 10
  );

  const handleStudentPageChange = (page: number) => {
    const total = Math.ceil(filteredStudents.length / 10);
    if (page >= 1 && page <= total) {
      setStudentCurrentPage(page);
    }
  };

  const filteredEvaluations = evaluations.filter(e => 
    e.studentId.includes(searchQuery) || 
    e.question.includes(searchQuery)
  );

  const filteredQuestions = questions.filter(q => 
    q.title.includes(searchQuery) || 
    q.content.includes(searchQuery)
  );

  /**
   * 导出学生信息到Excel
   */
  const exportStudentsToExcel = () => {
    const data = students.map(s => ({
      '班级': s.class,
      '学生姓名': s.name,
      '学号': s.studentId,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '学生信息');
    XLSX.writeFile(wb, '学生信息.xlsx');
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
                onClick={() => { setActiveTab('students'); }}
                className={cn(
                  'flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors sm:px-3 sm:text-sm',
                  activeTab === 'students'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                学生管理
              </button>
              <button
                onClick={() => { setActiveTab('questions'); }}
                className={cn(
                  'flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors sm:px-3 sm:text-sm',
                  activeTab === 'questions'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                题库管理
              </button>
              <button
                onClick={() => { setActiveTab('evaluations'); }}
                className={cn(
                  'flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors sm:px-3 sm:text-sm',
                  activeTab === 'evaluations'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
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
              <a
                href="/admin/resources"
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:px-3 sm:text-sm"
              >
                <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                学习资源
              </a>
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
              onClick={() => { setActiveTab('students'); setMobileMenuOpen(false); }}
              className={cn(
                'flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                activeTab === 'students'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted'
              )}
            >
              <Users className="w-4 h-4" />
              学生管理
            </button>
            <button
              onClick={() => { setActiveTab('questions'); setMobileMenuOpen(false); }}
              className={cn(
                'flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                activeTab === 'questions'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted'
              )}
            >
              <FileText className="w-4 h-4" />
              题库管理
            </button>
            <button
              onClick={() => { setActiveTab('evaluations'); setMobileMenuOpen(false); }}
              className={cn(
                'flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                activeTab === 'evaluations'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted'
              )}
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
            <a
              href="/admin/resources"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
            >
              <BookOpen className="w-4 h-4" />
              学习资源
            </a>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Search */}
        <div className="mb-3 sm:mb-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索..."
              className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 sm:max-w-md sm:pr-4"
            />
          </div>
        </div>

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="rounded-xl bg-card shadow-card p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3 sm:mb-4">
              <h2 className="text-base font-semibold text-foreground sm:text-lg">学生列表</h2>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={exportStudentsToExcel}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-accent-green/10 px-3 py-1.5 text-xs font-medium text-accent-green transition-colors hover:bg-accent-green hover:text-white sm:px-4 sm:py-2 sm:text-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  导出Excel
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-all hover:opacity-90 sm:px-4 sm:py-2 sm:text-sm"
                >
                  <Upload className="w-3.5 h-3.5" />
                  导入Excel
                </button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mb-3 sm:mb-4">
              Excel格式：班级、学生姓名、学号、密码（可选，默认123456）
            </p>

            {filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground sm:py-12">
                {students.length === 0 ? '暂无学生数据，请通过Excel导入' : '没有找到匹配的学生'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 text-[10px] font-medium text-muted-foreground sm:py-3 sm:px-4 sm:text-xs">班级</th>
                      <th className="text-left py-2 px-3 text-[10px] font-medium text-muted-foreground sm:py-3 sm:px-4 sm:text-xs">姓名</th>
                      <th className="text-left py-2 px-3 text-[10px] font-medium text-muted-foreground sm:py-3 sm:px-4 sm:text-xs">学号</th>
                      <th className="text-left py-2 px-3 text-[10px] font-medium text-muted-foreground sm:py-3 sm:px-4 sm:text-xs">密码</th>
                      <th className="text-left py-2 px-3 text-[10px] font-medium text-muted-foreground sm:py-3 sm:px-4 sm:text-xs">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedStudents.map((student) => (
                      <tr key={student.id} className="border-b border-border/50">
                        <td className="py-2 px-3 sm:py-3 sm:px-4">
                          {editingItem === student.id ? (
                            <input
                              value={editData.class}
                              onChange={(e) => setEditData({ ...editData, class: e.target.value })}
                              className="w-full rounded border border-border px-1.5 py-1 text-xs"
                            />
                          ) : (
                            <span className="text-xs text-foreground sm:text-sm">{student.class}</span>
                          )}
                        </td>
                        <td className="py-2 px-3 sm:py-3 sm:px-4">
                          {editingItem === student.id ? (
                            <input
                              value={editData.name}
                              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                              className="w-full rounded border border-border px-1.5 py-1 text-xs"
                            />
                          ) : (
                            <span className="text-xs text-foreground sm:text-sm">{student.name}</span>
                          )}
                        </td>
                        <td className="py-2 px-3 sm:py-3 sm:px-4">
                          {editingItem === student.id ? (
                            <input
                              value={editData.studentId}
                              onChange={(e) => setEditData({ ...editData, studentId: e.target.value })}
                              className="w-full rounded border border-border px-1.5 py-1 text-xs"
                            />
                          ) : (
                            <span className="text-xs text-foreground sm:text-sm">{student.studentId}</span>
                          )}
                        </td>
                        <td className="py-2 px-3 sm:py-3 sm:px-4">
                          {editingItem === student.id ? (
                            <input
                              value={editData.password}
                              onChange={(e) => setEditData({ ...editData, password: e.target.value })}
                              placeholder="留空则不修改"
                              className="w-full rounded border border-border px-1.5 py-1 text-xs"
                            />
                          ) : (
                            <span className="text-xs text-muted-foreground">******</span>
                          )}
                        </td>
                        <td className="py-2 px-3 sm:py-3 sm:px-4">
                          <div className="flex items-center gap-1">
                            {editingItem === student.id ? (
                              <>
                                <button
                                  onClick={() => handleSaveEditStudent(student.id)}
                                  className="rounded p-1 text-accent-green hover:bg-accent-green/10"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => { setEditingItem(null); setEditData({}); }}
                                  className="rounded p-1 text-muted-foreground hover:bg-muted"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleStartEditStudent(student)}
                                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteStudent(student.id)}
                                  className="rounded p-1 text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-3 flex flex-col items-center sm:mt-4">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleStudentPageChange(studentCurrentPage - 1)}
                      disabled={studentCurrentPage === 1}
                      className="inline-flex items-center justify-center rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50 disabled:pointer-events-none sm:px-3 sm:py-1.5 sm:text-sm"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    {Array.from({ length: Math.min(5, Math.ceil(filteredStudents.length / 10)) }, (_, i) => {
                      const totalPages = Math.ceil(filteredStudents.length / 10);
                      const pageNum = totalPages <= 5 ? i + 1 : 
                        studentCurrentPage <= 3 ? i + 1 : 
                        studentCurrentPage >= totalPages - 2 ? totalPages - 4 + i : 
                        studentCurrentPage - 2 + i;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handleStudentPageChange(pageNum)}
                          className={cn(
                            "min-w-6 rounded-md px-2 py-1 text-xs font-medium transition-colors sm:min-w-8 sm:px-3 sm:py-1.5 sm:text-sm",
                            studentCurrentPage === pageNum
                              ? "bg-primary text-primary-foreground"
                              : "border border-border bg-background text-foreground hover:bg-muted"
                          )}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => handleStudentPageChange(studentCurrentPage + 1)}
                      disabled={studentCurrentPage === Math.ceil(filteredStudents.length / 10)}
                      className="inline-flex items-center justify-center rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50 disabled:pointer-events-none sm:px-3 sm:py-1.5 sm:text-sm"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="mt-2 text-center text-[10px] text-muted-foreground sm:text-xs">
                    第 {studentCurrentPage} / {Math.ceil(filteredStudents.length / 10)} 页，共 {filteredStudents.length} 条记录
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Questions Tab */}
        {activeTab === 'questions' && (
          <div className="space-y-6">
            {/* Add Question Form */}
            <div className="rounded-xl bg-card shadow-card p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">添加新题目</h2>
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">题目标题</label>
                  <input
                    value={newQuestion.title}
                    onChange={(e) => setNewQuestion({ ...newQuestion, title: e.target.value })}
                    placeholder="如：计算两数之和"
                    className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">题目内容</label>
                  <textarea
                    value={newQuestion.content}
                    onChange={(e) => setNewQuestion({ ...newQuestion, content: e.target.value })}
                    placeholder="详细描述题目要求"
                    rows={3}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">解题提示</label>
                  <textarea
                    value={newQuestion.hint}
                    onChange={(e) => setNewQuestion({ ...newQuestion, hint: e.target.value })}
                    placeholder="给学生的解题提示"
                    rows={2}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">示例代码</label>
                  <textarea
                    value={newQuestion.exampleCode}
                    onChange={(e) => setNewQuestion({ ...newQuestion, exampleCode: e.target.value })}
                    placeholder="参考答案代码"
                    rows={4}
                    className="w-full rounded-lg border border-border bg-[#1E1E2E] px-4 py-2 text-sm font-mono text-[#CDD6F4] placeholder:text-[#6C7086] focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <button
                  onClick={handleAddQuestion}
                  className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"
                >
                  <Plus className="w-4 h-4" />
                  添加题目
                </button>
              </div>
            </div>

            {/* Questions List */}
            <div className="rounded-xl bg-card shadow-card p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">题目列表</h2>
              {filteredQuestions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {questions.length === 0 ? '暂无自定义题目' : '没有找到匹配的题目'}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredQuestions.map((question) => (
                    <div key={question.id} className="rounded-lg bg-muted/50 p-4">
                      {editingItem === question.id ? (
                        <div className="space-y-3">
                          <input
                            value={editData.title}
                            onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                            className="w-full rounded border border-border px-3 py-2 text-sm"
                          />
                          <textarea
                            value={editData.content}
                            onChange={(e) => setEditData({ ...editData, content: e.target.value })}
                            rows={2}
                            className="w-full rounded border border-border px-3 py-2 text-sm"
                          />
                          <textarea
                            value={editData.hint}
                            onChange={(e) => setEditData({ ...editData, hint: e.target.value })}
                            rows={1}
                            className="w-full rounded border border-border px-3 py-2 text-sm"
                          />
                          <textarea
                            value={editData.exampleCode}
                            onChange={(e) => setEditData({ ...editData, exampleCode: e.target.value })}
                            rows={3}
                            className="w-full rounded border border-border bg-[#1E1E2E] px-3 py-2 text-sm font-mono text-[#CDD6F4]"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSaveEditQuestion(question.id)}
                              className="flex items-center gap-1 rounded-lg bg-accent-green px-3 py-1.5 text-sm font-medium text-white"
                            >
                              <Save className="w-3.5 h-3.5" />
                              保存
                            </button>
                            <button
                              onClick={() => { setEditingItem(null); setEditData({}); }}
                              className="flex items-center gap-1 rounded-lg bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground"
                            >
                              <X className="w-3.5 h-3.5" />
                              取消
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                              #{question.id}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleStartEditQuestion(question)}
                                className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteQuestion(question.id)}
                                className="rounded p-1.5 text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <h3 className="text-sm font-medium text-foreground mb-1">{question.title}</h3>
                          <p className="text-sm text-muted-foreground">{question.content}</p>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Evaluations Tab */}
        {activeTab === 'evaluations' && (
          <div className="rounded-xl bg-card shadow-card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">学情记录</h2>
            {filteredEvaluations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {evaluations.length === 0 ? '暂无学情记录' : '没有找到匹配的记录'}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEvaluations.map((evaluation) => (
                  <div key={evaluation.id} className="rounded-lg bg-muted/50 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-accent-green/10 px-2 py-0.5 text-xs font-medium text-accent-green">
                          {evaluation.studentId}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(evaluation.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteEvaluation(evaluation.id)}
                        className="rounded p-1.5 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="mb-2">
                      <span className="text-xs text-muted-foreground">题目：</span>
                      <p className="text-sm text-foreground">{evaluation.question}</p>
                    </div>
                    <div className="mb-2">
                      <span className="text-xs text-muted-foreground">代码：</span>
                      <pre className="text-xs font-mono bg-[#1E1E2E] p-2 rounded mt-1 text-[#CDD6F4] overflow-x-auto">
                        {evaluation.code}
                      </pre>
                    </div>
                    <div className="break-all">
                      <span className="text-xs text-muted-foreground">评价报告：</span>
                      <p className="text-xs text-foreground mt-1 sm:text-sm break-all whitespace-pre-wrap">{evaluation.report}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}