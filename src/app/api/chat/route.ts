import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import {
  createChatConversation,
  getChatConversation,
  getChatMessages,
  addChatMessage,
  getChatConversations,
  deleteChatConversation,
  updateChatConversationTitle,
} from '@/lib/db';
import { validateSession } from '@/lib/auth';
import { getSession } from '@/lib/db';

export const runtime = 'nodejs';
export const maxDuration = 60;

const SYSTEM_PROMPT = `你是"码上成长"平台的 AI 解惑助手，专门为中职学生解答 Python 学习中的疑惑。

【核心规则 - 必须严格遵守】
1. 学科范围：你只能回答 Python 编程相关的问题。如果用户询问 Python 以外的内容（如 Java、C++、数学、英语、其他学科等），请礼貌拒绝并引导用户回到 Python 学习。
2. 代码规则：绝对不要直接给出完整的代码答案！你的角色是引导者，不是代写者。
   - 不允许：直接写出完整的可运行代码
   - 允许：给出关键思路、提示方向、伪代码片段（不超过3行的关键代码片段）
   - 允许：分析用户代码中的问题并指出错误位置
   - 允许：解释代码的运行原理
3. 教学风格：使用启发式、引导式的语言，像一位耐心的老师。
   - 多用"你可以试试..."、"想一想为什么..."、"试着检查一下..."等引导性句式
   - 先肯定学生的思考，再指出问题
   - 避免直接给答案，鼓励学生自己思考

【回答结构】
- 简洁明了，分点说明
- 使用 Markdown 格式组织内容
- 代码片段必须用 \`\`\`python 代码块包裹
- 关键概念用 **加粗** 突出

【特别提示】
- 学生年龄较小（15-18岁），语言要通俗易懂
- 如果学生的问题不清楚，先询问澄清
- 对于错误信息，要引导他们学会自己分析错误
- 强调编程思维和方法，而不仅仅是结果`;

const PROMPT_TEMPLATES = {
  analyze: `请帮我进行"题目分析与知识点解析"：
- 我会提供一道题目的描述
- 请帮我分析：
  1. 这道题考察的核心知识点是什么？
  2. 解题的关键思路是什么？
  3. 涉及哪些 Python 概念？
- 不要直接给代码，引导我自己思考

【题目】
{question}`,
  explain: `请帮我进行"代码解释与注释"：
- 我会提供一段代码
- 请帮我：
  1. 逐行解释代码的含义
  2. 说明关键函数或语法的作用
  3. 给出整体逻辑的说明
- 不要修改代码，只是解释

【代码】
\`\`\`python
{code}
\`\`\``,
  debug: `请帮我进行"调试帮助与错误分析"：
- 我会提供代码和错误信息
- 请帮我：
  1. 分析错误产生的原因
  2. 指出可能的错误位置
  3. 给出调试思路（不要直接给修复后的完整代码）
  4. 提示我应该检查哪些地方

【代码】
\`\`\`python
{code}
\`\`\`

【错误信息】
{error}`,
  algorithm: `请帮我进行"算法思路引导"：
- 我会描述一个问题
- 请帮我：
  1. 拆解问题为子问题
  2. 提示可能用到的算法或数据结构
  3. 引导我思考最优解
  4. 不要直接写代码

【问题】
{question}`,
};

interface ChatRequest {
  action: 'list' | 'create' | 'get' | 'send' | 'delete' | 'rename';
  studentId?: string;
  conversationId?: string;
  title?: string;
  message?: string;
  template?: keyof typeof PROMPT_TEMPLATES;
  templateVars?: Record<string, string>;
}

/**
 * 从用户输入中获取学生ID（通过session验证）
 */
async function getStudentIdFromSession(request: NextRequest): Promise<string | null> {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    // 简单从请求中获取session（生产环境应通过cookie）
    const body = await request.clone().json().catch(() => null);
    if (body?.sessionId) {
      const session = getSession(body.sessionId);
      if (session && session.userType === 'student') {
        return session.userId;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  let body: ChatRequest;
  try {
    body = (await request.json()) as ChatRequest;
  } catch {
    return NextResponse.json(
      { success: false, error: '请求体不是合法 JSON' },
      { status: 400 }
    );
  }

  const { action } = body;

  switch (action) {
    case 'list':
      return handleList(request, body);
    case 'create':
      return handleCreate(body);
    case 'get':
      return handleGet(body);
    case 'send':
      return handleSend(body);
    case 'delete':
      return handleDelete(body);
    case 'rename':
      return handleRename(body);
    default:
      return NextResponse.json(
        { success: false, error: '无效的操作类型' },
        { status: 400 }
      );
  }
}

/**
 * 获取学生的所有会话
 */
function handleList(request: NextRequest, body: ChatRequest) {
  const studentId = body.studentId;
  if (!studentId) {
    return NextResponse.json(
      { success: false, error: '缺少学生ID' },
      { status: 400 }
    );
  }
  const conversations = getChatConversations(studentId);
  return NextResponse.json({ success: true, conversations });
}

/**
 * 创建新会话
 */
function handleCreate(body: ChatRequest) {
  const { studentId, title } = body;
  if (!studentId) {
    return NextResponse.json(
      { success: false, error: '缺少学生ID' },
      { status: 400 }
    );
  }
  const conversation = createChatConversation(studentId, title || '新对话');
  return NextResponse.json({ success: true, conversation });
}

/**
 * 获取会话详情（含消息）
 */
function handleGet(body: ChatRequest) {
  const { conversationId } = body;
  if (!conversationId) {
    return NextResponse.json(
      { success: false, error: '缺少会话ID' },
      { status: 400 }
    );
  }
  const conversation = getChatConversation(conversationId);
  if (!conversation) {
    return NextResponse.json(
      { success: false, error: '会话不存在' },
      { status: 404 }
    );
  }
  const messages = getChatMessages(conversationId);
  return NextResponse.json({ success: true, conversation, messages });
}

/**
 * 发送消息并获取AI回复
 */
async function handleSend(body: ChatRequest) {
  const { conversationId, message, template, templateVars } = body;

  if (!conversationId) {
    return NextResponse.json(
      { success: false, error: '缺少会话ID' },
      { status: 400 }
    );
  }

  // 构建实际发送的消息内容
  let userMessage = (message || '').trim();
  if (template && PROMPT_TEMPLATES[template]) {
    let templateContent = PROMPT_TEMPLATES[template];
    if (templateVars) {
      Object.entries(templateVars).forEach(([key, value]) => {
        templateContent = templateContent.replace(`{${key}}`, value || '');
      });
    }
    userMessage = templateContent;
  }

  if (!userMessage) {
    return NextResponse.json(
      { success: false, error: '消息内容不能为空' },
      { status: 400 }
    );
  }

  if (userMessage.length > 4000) {
    return NextResponse.json(
      { success: false, error: '消息长度超过限制（4000 字符）' },
      { status: 400 }
    );
  }

  // 验证会话存在
  const conversation = getChatConversation(conversationId);
  if (!conversation) {
    return NextResponse.json(
      { success: false, error: '会话不存在' },
      { status: 404 }
    );
  }

  // 保存用户消息
  addChatMessage(conversationId, 'user', userMessage);

  // 获取历史消息构建上下文
  const history = getChatMessages(conversationId);
  const apiMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: SYSTEM_PROMPT },
  ];

  // 取最近20条历史消息
  const recentMessages = history.slice(-20);
  for (const msg of recentMessages) {
    if (msg.role === 'user' || msg.role === 'assistant') {
      apiMessages.push({ role: msg.role, content: msg.content });
    }
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  const apiBase = process.env.DEEPSEEK_API_BASE || 'https://api.deepseek.com/v1';

  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: '请配置 DEEPSEEK_API_KEY 环境变量' },
      { status: 500 }
    );
  }

  const client = new OpenAI({ apiKey, baseURL: apiBase });

  try {
    const response = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: apiMessages,
      temperature: 0.7,
      max_tokens: 2000,
    });

    const aiContent = response.choices[0]?.message?.content;
    if (!aiContent) {
      return NextResponse.json(
        { success: false, error: 'AI 返回内容为空' },
        { status: 502 }
      );
    }

    // 保存AI回复
    const assistantMessage = addChatMessage(conversationId, 'assistant', aiContent);

    // 如果是会话的第一条消息，自动更新标题
    if (history.length === 1) {
      const newTitle = userMessage.slice(0, 20) + (userMessage.length > 20 ? '...' : '');
      updateChatConversationTitle(conversationId, newTitle);
    }

    return NextResponse.json({
      success: true,
      message: assistantMessage,
      titleUpdated: history.length === 1,
    });
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : '调用 AI 失败';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * 删除会话
 */
function handleDelete(body: ChatRequest) {
  const { conversationId } = body;
  if (!conversationId) {
    return NextResponse.json(
      { success: false, error: '缺少会话ID' },
      { status: 400 }
    );
  }
  const success = deleteChatConversation(conversationId);
  return NextResponse.json({ success });
}

/**
 * 重命名会话
 */
function handleRename(body: ChatRequest) {
  const { conversationId, title } = body;
  if (!conversationId || !title) {
    return NextResponse.json(
      { success: false, error: '缺少会话ID或标题' },
      { status: 400 }
    );
  }
  const success = updateChatConversationTitle(conversationId, title);
  return NextResponse.json({ success });
}