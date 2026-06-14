/**
 * 用户认证模块（前端）
 * 通过API调用与后端数据库交互
 */

export interface Student {
  id: number;
  studentId: string;
  name: string;
  class: string;
}

export interface Admin {
  username: string;
}

export interface EvaluationRecord {
  id: number;
  studentId: string;
  question: string;
  code: string;
  report: string;
  score: number;
  createdAt: string;
}

export interface QuestionItem {
  id: number;
  title: string;
  content: string;
  hint: string;
  exampleCode: string;
}

const SESSION_KEY = 'mscz_session_id';

/**
 * 获取本地存储的sessionId
 */
export function getSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SESSION_KEY);
}

/**
 * 设置sessionId到本地存储
 */
export function setSessionId(sessionId: string): void {
  localStorage.setItem(SESSION_KEY, sessionId);
}

/**
 * 清除sessionId
 */
export function clearSessionId(): void {
  localStorage.removeItem(SESSION_KEY);
}

/**
 * 登录API调用
 */
export async function login(type: 'admin' | 'student', username: string, password: string): Promise<{
  success: boolean;
  error?: string;
  sessionId?: string;
  userType?: 'admin' | 'student';
  user?: Admin | Student;
}> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, username, password }),
    });
    const data = await res.json();
    return data;
  } catch {
    return { success: false, error: '登录失败，请稍后重试' };
  }
}

/**
 * 验证当前session
 */
export async function validateSession(): Promise<{
  success: boolean;
  userType?: 'admin' | 'student';
  user?: Admin | Student;
}> {
  const sessionId = getSessionId();
  if (!sessionId) {
    return { success: false };
  }

  try {
    const res = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });
    const data = await res.json();
    return data;
  } catch {
    return { success: false };
  }
}

/**
 * 退出登录
 */
export async function logout(): Promise<void> {
  const sessionId = getSessionId();
  if (sessionId) {
    try {
      await fetch('/api/auth/session', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
    } catch {}
  }
  clearSessionId();
}

/* ========== 学生操作 ========== */

/**
 * 获取所有学生
 */
export async function getStudents(): Promise<Student[]> {
  try {
    const res = await fetch('/api/students');
    const data = await res.json();
    return data.success ? data.students : [];
  } catch {
    return [];
  }
}

/**
 * 批量添加学生
 */
export async function addStudents(students: { studentId: string; name: string; class: string; password: string }[]): Promise<{
  success: boolean;
  message?: string;
  count?: number;
  error?: string;
}> {
  try {
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ students }),
    });
    return await res.json();
  } catch {
    return { success: false, error: '导入失败' };
  }
}

/**
 * 更新学生信息
 */
export async function updateStudent(id: number, data: { studentId?: string; name?: string; class?: string; password?: string }): Promise<boolean> {
  try {
    const res = await fetch('/api/students', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, data }),
    });
    const result = await res.json();
    return result.success;
  } catch {
    return false;
  }
}

/**
 * 删除学生
 */
export async function deleteStudent(id: number): Promise<boolean> {
  try {
    const res = await fetch('/api/students', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const result = await res.json();
    return result.success;
  } catch {
    return false;
  }
}

/* ========== 学情记录操作 ========== */

/**
 * 获取所有学情记录
 */
export async function getEvaluations(): Promise<EvaluationRecord[]> {
  try {
    const res = await fetch('/api/evaluations');
    const data = await res.json();
    return data.success ? data.evaluations : [];
  } catch {
    return [];
  }
}

/**
 * 获取指定学生的学情记录
 */
export async function getStudentEvaluations(studentId: string): Promise<EvaluationRecord[]> {
  try {
    const res = await fetch(`/api/evaluations?studentId=${studentId}`);
    const data = await res.json();
    return data.success ? data.evaluations : [];
  } catch {
    return [];
  }
}

/**
 * 添加学情记录
 */
export async function addEvaluation(record: { studentId: string; question: string; code: string; report: string; score: number }): Promise<EvaluationRecord | null> {
  try {
    const res = await fetch('/api/evaluations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    const data = await res.json();
    return data.success ? data.record : null;
  } catch {
    return null;
  }
}

/**
 * 删除学情记录
 */
export async function deleteEvaluation(id: number): Promise<boolean> {
  try {
    const res = await fetch('/api/evaluations', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const result = await res.json();
    return result.success;
  } catch {
    return false;
  }
}

/* ========== 题库操作 ========== */

/**
 * 获取题库列表
 */
export async function getQuestions(): Promise<QuestionItem[]> {
  try {
    const res = await fetch('/api/questions');
    const data = await res.json();
    return data.success ? data.questions : [];
  } catch {
    return [];
  }
}

/**
 * 添加题目
 */
export async function addQuestion(question: { title: string; content: string; hint: string; exampleCode: string }): Promise<QuestionItem | null> {
  try {
    const res = await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(question),
    });
    const data = await res.json();
    return data.success ? data.question : null;
  } catch {
    return null;
  }
}

/**
 * 更新题目
 */
export async function updateQuestion(id: number, data: { title?: string; content?: string; hint?: string; exampleCode?: string }): Promise<boolean> {
  try {
    const res = await fetch('/api/questions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, data }),
    });
    const result = await res.json();
    return result.success;
  } catch {
    return false;
  }
}

/**
 * 删除题目
 */
export async function deleteQuestion(id: number): Promise<boolean> {
  try {
    const res = await fetch('/api/questions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const result = await res.json();
    return result.success;
  } catch {
    return false;
  }
}