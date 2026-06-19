/**
 * 用户认证模块（前端）
 * 
 * 本模块负责处理用户登录、会话管理、学生数据操作、学情记录管理和题库管理等功能。
 * 通过API调用与后端数据库进行交互，实现完整的用户认证和数据管理流程。
 * 
 * @module auth
 * @author MYJ
 * @version 1.0.0
 */

/**
 * 学生信息接口定义
 */
export interface Student {
  id: number;
  studentId: string;
  name: string;
  class: string;
}

/**
 * 管理员信息接口定义
 */
export interface Admin {
  username: string;
}

/**
 * 学情评价记录接口定义
 */
export interface EvaluationRecord {
  id: number;
  studentId: string;
  question: string;
  code: string;
  report: string;
  score: number;
  createdAt: string;
}

/**
 * 题库题目接口定义
 */
export interface QuestionItem {
  id: number;
  title: string;
  content: string;
  hint: string;
  exampleCode: string;
}

/**
 * 学习资源接口定义
 */
export interface LearningResource {
  id: number;
  title: string;
  url: string;
  description: string;
  sortOrder: number;
  createdAt: string;
}

/**
 * Session存储键名常量
 */
const SESSION_KEY = 'mscz_session_id';

/**
 * 获取本地存储的sessionId
 * 
 * @returns {string | null} sessionId字符串，若不存在则返回null
 */
export function getSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SESSION_KEY);
}

/**
 * 设置sessionId到本地存储
 * 
 * @param {string} sessionId - 要存储的sessionId
 */
export function setSessionId(sessionId: string): void {
  localStorage.setItem(SESSION_KEY, sessionId);
}

/**
 * 清除本地存储的sessionId
 */
export function clearSessionId(): void {
  localStorage.removeItem(SESSION_KEY);
}

/**
 * 用户登录API调用
 * 
 * @param {'admin' | 'student'} type - 用户类型：管理员或学生
 * @param {string} username - 用户名（管理员为用户名，学生为学号）
 * @param {string} password - 密码
 * @returns {Promise<{ success: boolean; error?: string; sessionId?: string; userType?: 'admin' | 'student'; user?: Admin | Student }>}
 *          登录结果对象，包含成功状态、错误信息、sessionId和用户信息
 */
export async function login(
  type: 'admin' | 'student',
  username: string,
  password: string
): Promise<{
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
 * 验证当前session有效性
 * 
 * @returns {Promise<{ success: boolean; userType?: 'admin' | 'student'; user?: Admin | Student }>}
 *          session验证结果，包含成功状态、用户类型和用户信息
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
 * 用户退出登录
 * 
 * 向服务器发送注销请求，并清除本地存储的sessionId
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

/* ========== 学生操作模块 ========== */

/**
 * 获取所有学生列表
 * 
 * @returns {Promise<Student[]>} 学生列表数组
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
 * 
 * @param {{ studentId: string; name: string; class: string; password: string }[]} students - 学生信息数组
 * @returns {Promise<{ success: boolean; message?: string; count?: number; error?: string }>}
 *          添加结果，包含成功状态、提示信息、添加数量和错误信息
 */
export async function addStudents(
  students: { studentId: string; name: string; class: string; password: string }[]
): Promise<{
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
 * 
 * @param {number} id - 学生记录ID
 * @param {{ studentId?: string; name?: string; class?: string; password?: string }} data - 要更新的学生信息
 * @returns {Promise<boolean>} 更新是否成功
 */
export async function updateStudent(
  id: number,
  data: { studentId?: string; name?: string; class?: string; password?: string }
): Promise<boolean> {
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
 * 
 * @param {number} id - 学生记录ID
 * @returns {Promise<boolean>} 删除是否成功
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

/* ========== 学情记录操作模块 ========== */

/**
 * 获取所有学情评价记录
 * 
 * @returns {Promise<EvaluationRecord[]>} 评价记录数组
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
 * 获取指定学生的学情评价记录
 * 
 * @param {string} studentId - 学生学号
 * @returns {Promise<EvaluationRecord[]>} 该学生的评价记录数组
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
 * 添加学情评价记录
 * 
 * @param {{ studentId: string; question: string; code: string; report: string; score: number }} record - 评价记录数据
 * @returns {Promise<EvaluationRecord | null>} 添加成功返回记录对象，失败返回null
 */
export async function addEvaluation(
  record: { studentId: string; question: string; code: string; report: string; score: number }
): Promise<EvaluationRecord | null> {
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
 * 删除学情评价记录
 * 
 * @param {number} id - 评价记录ID
 * @returns {Promise<boolean>} 删除是否成功
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

/* ========== 题库操作模块 ========== */

/**
 * 获取题库列表
 * 
 * @returns {Promise<QuestionItem[]>} 题目列表数组
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
 * 添加新题目
 * 
 * @param {{ title: string; content: string; hint: string; exampleCode: string }} question - 题目数据
 * @returns {Promise<QuestionItem | null>} 添加成功返回题目对象，失败返回null
 */
export async function addQuestion(
  question: { title: string; content: string; hint: string; exampleCode: string }
): Promise<QuestionItem | null> {
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
 * 更新题目信息
 * 
 * @param {number} id - 题目ID
 * @param {{ title?: string; content?: string; hint?: string; exampleCode?: string }} data - 要更新的题目信息
 * @returns {Promise<boolean>} 更新是否成功
 */
export async function updateQuestion(
  id: number,
  data: { title?: string; content?: string; hint?: string; exampleCode?: string }
): Promise<boolean> {
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
 * 
 * @param {number} id - 题目ID
 * @returns {Promise<boolean>} 删除是否成功
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

/* ========== 学习资源操作模块 ========== */

/**
 * 获取学习资源列表
 *
 * @returns {Promise<LearningResource[]>} 学习资源列表数组
 */
export async function getLearningResources(): Promise<LearningResource[]> {
  try {
    const res = await fetch('/api/resources');
    const data = await res.json();
    return data.success ? data.resources : [];
  } catch {
    return [];
  }
}

/**
 * 添加学习资源
 *
 * @param {{ title: string; url: string; description?: string; sortOrder?: number }} resource - 学习资源数据
 * @returns {Promise<LearningResource | null>} 添加成功返回资源对象，失败返回null
 */
export async function addLearningResource(
  resource: { title: string; url: string; description?: string; sortOrder?: number }
): Promise<LearningResource | null> {
  try {
    const res = await fetch('/api/resources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resource),
    });
    const data = await res.json();
    return data.success ? data.resource : null;
  } catch {
    return null;
  }
}

/**
 * 更新学习资源
 *
 * @param {number} id - 资源ID
 * @param {{ title?: string; url?: string; description?: string; sortOrder?: number }} data - 要更新的资源信息
 * @returns {Promise<boolean>} 更新是否成功
 */
export async function updateLearningResource(
  id: number,
  data: { title?: string; url?: string; description?: string; sortOrder?: number }
): Promise<boolean> {
  try {
    const res = await fetch('/api/resources', {
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
 * 删除学习资源
 *
 * @param {number} id - 资源ID
 * @returns {Promise<boolean>} 删除是否成功
 */
export async function deleteLearningResource(id: number): Promise<boolean> {
  try {
    const res = await fetch('/api/resources', {
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
