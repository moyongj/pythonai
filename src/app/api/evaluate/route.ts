import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { addEvaluation } from '@/lib/db';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface EvaluationRequest {
  name: string;
  studentId?: string;
  question: string;
  code: string;
}

const KNOWLEDGE_POINTS = [
  '运算符 — 赋值 = 与判断相等 == 混用',
  '运算符 — 不等号！= 误写为 <> 、 =/ 等错误格式',
  '运算符 — 逻辑运算符 and/or/not 中英文写法混淆',
  '运算符 — 算术运算符 +、-、*、/、//、% 优先级理解错误',
  '运算符 — 整除 // 、取余 % 使用场景与计算错误',
  '运算符 — 自增 += 、自减 -= 复合赋值运算符书写错误',
  '标点符号 — 代码中混用中文逗号、英文逗号',
  '标点符号 — 圆括号 () 中英文混用、括号配对缺失',
  '标点符号 — 单引号 / 双引号中英文混用、引号嵌套出错',
  '标点符号 — 列表 [] 、字典 {} 括号书写错误、配对不全',
  '语句标识 —if/for/while/def 语句末尾缺失冒号 :',
  '语句标识 — 多余添加分号；，画蛇添足',
  '缩进 — 循环、条件语句代码块未缩进',
  '缩进 — 多层代码块缩进层级错乱',
  '缩进 — 空格缩进与 Tab 缩进混合使用',
  '缩进 — 缩进空格数量不统一（非 4 个标准空格）',
  '排版 — 代码行首尾出现多余空格',
  '排版 — 功能模块间空行过多 / 缺失空行',
  '排版 — 单行堆砌大量代码，无合理换行',
  '变量 — 使用前未定义变量',
  '变量 — 变量名使用 Python 关键字（if、for、def 等）',
  '变量 — 变量名使用中文、特殊符号、数字开头',
  '变量 — 使用 a/b/c/x/y 等无意义单字母命名（规范扣分）',
  '变量 — 同一作用域内变量重复定义、覆盖原值',
  '变量 — 全局变量与局部变量混用、调用错误',
  '变量 — 变量赋值顺序颠倒，先使用后赋值',
  '数据类型 — 字符串与数字直接拼接，未做类型转换',
  '数据类型 — 布尔值 True/False 大小写书写错误',
  '数据类型 — 空值 None 误写为 null 、 Null',
  '数据类型 — 类型判断 type () 函数使用错误',
  '数字类型 — 整数、浮点数运算精度理解偏差',
  '数字类型 — 负数书写格式错误',
  '字符串 — 单引号、双引号嵌套冲突',
  '字符串 — 三引号多行字符串起止符号不匹配',
  '字符串 — 字符串切片起始 / 结束索引设置错误',
  '字符串 — 切片步长 step 参数使用错误',
  '字符串 — len () 统计字符串长度理解错误',
  '字符串 — input () 接收内容默认字符串类型认知不足',
  '字符串 — 字符串拼接 + 与格式化输出混用出错',
  '字符串 — format () 格式化语法书写错误',
  '字符串 —f-string 格式化引号嵌套错误',
  '输入输出 — input () 接收数字，未用 int ()/float () 转换',
  '输入输出 — input () 括号缺失、参数书写错误',
  '输入输出 — print () 括号缺失、多个参数分隔错误',
  '输入输出 — print () 换行、不换行控制写法错误',
  '输入输出 — print () 输出内容引号包裹不全',
  '条件判断 — 单分支 if 语句逻辑条件书写错误',
  '条件判断 — 多分支 if/elif/else 顺序颠倒',
  '条件判断 — elif 单独使用，前置无 if 语句',
  '条件判断 — else 后错误添加判断条件',
  '条件判断 — 多条件组合 and/or 逻辑搭配错误',
  '条件判断 — 连续区间判断简写格式错误（如 1<a<5 误用）',
  '条件判断 — 条件表达式逻辑颠倒，判断结果相反',
  '条件判断 — 多层 if 嵌套冗余，逻辑复杂化',
  '条件判断 — 判断列表、字符串非空写法不规范',
  'for 循环 — range () 单参数、双参数、三参数规则理解错误',
  'for 循环 — range () 起止数值、步长设置错误',
  'for 循环 — 遍历列表 / 字符串 / 字典时取值逻辑错误',
  'for 循环 — 循环体内语句范围划分错误（缩进问题衍生）',
  'for 循环 — 嵌套 for 循环内外层变量混淆',
  'while 循环 — 循环条件设置错误，引发死循环',
  'while 循环 — 循环变量未做自增 / 自减，无法退出循环',
  'while 循环 — 循环终止条件逻辑缺失',
  'while 循环 — 嵌套 while 循环层级逻辑混乱',
  '循环通用关键字 — break 跳出循环使用场景错误',
  '循环通用关键字 — continue 跳过本次循环使用错误',
  '循环通用关键字 — break/continue 作用范围理解错误（嵌套循环）',
  '列表 — 创建列表方括号 [] 书写错误、元素分隔错误',
  '列表 — 列表索引越界，访问不存在的下标',
  '列表 — 正负索引混用、索引取值理解错误',
  '列表 — append () 末尾追加元素方法调用错误',
  '列表 — insert () 指定位置插入，下标参数错误',
  '列表 — pop () 删除元素下标、返回值理解错误',
  '列表 — remove () 按值删除，找不到元素引发异常',
  '列表 — del 语句删除列表 / 元素格式错误',
  '列表 — 遍历列表同时增删元素，逻辑异常',
  '列表 — 列表拼接 + 、重复 * 运算符使用错误',
  '列表 — 二维列表嵌套层级访问错误',
  '字典 — 创建字典大括号 {} 书写错误',
  '字典 — 键值对 键：值 冒号缺失、格式错误',
  '字典 — 键名重复，后值覆盖前值认知不足',
  '字典 — 直接访问不存在的键，引发报错',
  '字典 — get () 方法获取值，默认参数使用错误',
  '字典 — keys ()/values ()/items () 遍历方法调用错误',
  '字典 — 字典元素增、删、改操作语法错误',
  '字典 — 字典嵌套取值层级错误',
  '元组 — 小括号 () 创建元组格式错误',
  '元组 — 单元素元组末尾缺失逗号',
  '元组 — 尝试修改元组元素，违背不可变特性',
  '集合 — 空集合创建错误（误用 {} 代替 set () ）',
  '集合 — 元素去重特性理解错误',
  '集合 — 交集、并集、差集运算符号 / 方法使用错误',
  '集合 — add ()/remove () 增删元素方法调用错误',
  '函数 — def 关键字定义函数格式错误',
  '函数 — 函数名命名不规范（关键字、数字开头）',
  '函数 — 函数定义行括号、末尾冒号缺失',
  '函数 — 形参和实参数量不匹配',
  '函数 — 位置参数、关键字参数混用顺序错误',
  '函数 — 默认参数设置与调用错误',
  '函数 — return 返回值书写位置错误',
  '函数 — 无返回值函数强行接收返回结果',
  '函数 — 函数调用位置错误（先调用后定义）',
  '函数 — 函数嵌套调用逻辑混乱',
  '函数 — 函数内部、外部变量作用域理解错误',
  '异常处理 — try-except 语句格式、缩进错误',
  '异常处理 — 捕获异常类型书写错误',
  '异常处理 — except 后无异常类型，滥用捕获',
  '异常处理 — finally 语句执行逻辑理解错误',
  '异常处理 — 主动抛出 raise 语句使用错误',
  '文件操作 — open () 函数路径、打开模式 r/w/a 书写错误',
  '文件操作 — 文件读写编码 encoding 参数缺失 / 错误',
  '文件操作 — read ()/readline () 读取文件内容用法错误',
  '文件操作 — 写入文件 write () 参数格式错误',
  '文件操作 — 打开文件后未执行关闭 close () 操作',
  '模块导入 — import 关键字书写错误',
  '模块导入 — from xxx import xxx 导入格式错误',
  '模块导入 — 导入模块后，调用方法语法错误',
  '模块导入 — 自定义模块命名与系统模块重名',
  '代码结构 — 重复编写完全一致的语句，内容冗余',
  '代码结构 — 定义无效变量、声明无用语句',
  '代码结构 — 语句执行顺序颠倒，整体逻辑异常',
  '代码结构 — 多余嵌套语句，加重逻辑复杂度',
  '代码结构 — 功能拆分不合理，代码耦合度高',
  '注释 — 单行注释 # 符号后无空格，格式不规范',
  '注释 — 多行注释三引号使用混乱',
  '注释 — 注释内容与代码不匹配，误导阅读',
  '注释 — 关键代码无注释、无效位置堆砌注释',
];

function matchKnowledgePoints(inputKps: string[]): string[] {
  if (inputKps.length === 0) return [];

  const matched: string[] = [];
  const used = new Set<number>();

  for (const inputKp of inputKps) {
    if (matched.length >= 5) break;

    const inputLower = inputKp.toLowerCase();

    for (let i = 0; i < KNOWLEDGE_POINTS.length; i++) {
      if (used.has(i)) continue;

      const kp = KNOWLEDGE_POINTS[i];
      const kpPart = kp.split(' — ')[1]?.toLowerCase() || '';

      const kpWords = kpPart.replace(/[()]/g, '').split(/\s+/);
      const matchedWords = kpWords.filter(word => word.length > 1 && inputLower.includes(word));

      if (matchedWords.length >= Math.ceil(kpWords.length * 0.4)) {
        matched.push(kp);
        used.add(i);
        break;
      }
    }
  }

  if (matched.length === 0 && inputKps.length > 0) {
    const firstKp = inputKps[0];
    for (let i = 0; i < KNOWLEDGE_POINTS.length; i++) {
      const kp = KNOWLEDGE_POINTS[i];
      const kpPart = kp.split(' — ')[1] || '';
      if (firstKp.includes(kpPart.substring(0, Math.min(4, kpPart.length)))) {
        matched.push(kp);
        used.add(i);
        break;
      }
    }
  }

  return matched.slice(0, 5);
}

const SYSTEM_PROMPT = `你是一位资深 Python 教师，正在为中职学生批改代码作业。你的评价风格是**鼓励式 + 具体化**：不直接给答案，而是用提示引导学生自己发现错误。

【评分维度与标准】

① 题目理解与实现（满分 30 分）— 核心
- 30 分（满分标准）：代码完整实现题目所有要求，输出结果与预期完全一致
- 20-29 分（部分得分）：主要逻辑正确但有小错误，或实现了大部分功能
- 10-19 分（较低得分）：思路方向正确但代码无法运行，或只完成一部分
- 评分依据：对照学生粘贴的题目要求评判；无题目则只看逻辑合理性

② 逻辑思路（满分 25 分）— 核心
- 25 分（满分标准）：解题思路清晰，条件判断和循环结构使用正确合理
- 16-24 分（部分得分）：整体思路对，但局部逻辑有冗余或小错误
- 8-15 分（较低得分）：思路混乱，逻辑结构明显有问题
- 重点考察：if/else 条件、for/while 循环、函数调用逻辑是否正确

③ 代码可读性（满分 25 分）— 基础
- 命名规范：变量名有意义，不用 a/b/x/y 等无意义单字母（循环变量 i 除外）
- 缩进统一：全文使用统一缩进（4 个空格或统一 Tab），无混用
- 结构清晰：代码分段合理，不把所有逻辑堆在一行
- 适当注释：关键步骤有简短注释（中职阶段有注释即加分，无则不扣分）
- 评分参考：4 项指标中 4 项优秀≈25，3 项优秀≈21，2 项优秀≈17，1 项或 0 项优秀≈12

④ 语法掌握（满分 20 分）— 基础
- 20 分（满分标准）：无语法错误，正确使用本章节涉及的 Python 语法
- 13-19 分（部分得分）：有 1-2 处语法错误，但不影响整体结构
- 6-12 分（较低得分）：有多处语法错误
- 考察重点：冒号、括号、引号配对；print/input 用法；赋值与比较不混淆
- 说明：静态分析判断，不实际运行，只看代码文本是否符合 Python 语法规则

【输出要求】
- 必须返回**纯 JSON**，不要包含任何 markdown 代码块标记或额外文字
- knowledgePoints（易错知识点）必须从代码实际表现中识别，不要硬塞通用项
- hint（提示）必须以"想一想"、"试试"等启发式语气引导，不直接给答案
- practice（练习题）必须在原题基础上做适当变形，但难度相当

【JSON 字段说明】
- understanding: { score: 0-30, comment: "对题目理解与实现的具体评语（2-3 句话，先肯定后建议）" }
- logic: { score: 0-25, comment: "对逻辑思路的具体评语" }
- readability: { score: 0-25, comment: "对代码可读性的具体评语" }
- syntax: { score: 0-20, comment: "对语法掌握的具体评语" }
- knowledgePoints: ["本次实际体现的易错知识点 1", "本次实际体现的易错知识点 2", ...]，没有则返回空数组
- hint: "给你的提示（不是答案）的内容，2-3 句启发式引导"
- practice: "类似练习题，难度相当、考察点相同"`;

function buildUserPrompt(name: string, question: string, code: string): string {
  return `【学生姓名】${name}

【题目要求】
${question || '（学生未提供题目，仅根据代码逻辑评分）'}

【学生代码】
\`\`\`python
${code}
\`\`\`

请按要求从四个维度静态分析上述 Python 代码，并返回严格符合 schema 的 JSON。`;
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    // ignore
  }
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch {
      // ignore
    }
  }
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      // ignore
    }
  }
  return null;
}

function clamp(value: unknown, min: number, max: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function asString(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

export async function POST(request: NextRequest) {
  let body: EvaluationRequest;
  try {
    body = (await request.json()) as EvaluationRequest;
  } catch {
    return NextResponse.json(
      { success: false, error: '请求体不是合法 JSON' },
      { status: 400 },
    );
  }

  const name = (body.name ?? '').trim();
  const question = (body.question ?? '').trim();
  const code = (body.code ?? '').trim();

  if (!name || !code) {
    return NextResponse.json(
      { success: false, error: '缺少姓名或代码' },
      { status: 400 },
    );
  }

  if (code.length > 20000) {
    return NextResponse.json(
      { success: false, error: '代码长度超过限制（20000 字符）' },
      { status: 400 },
    );
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  const apiBase = process.env.DEEPSEEK_API_BASE || 'https://api.deepseek.com/v1';

  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: '请配置 DEEPSEEK_API_KEY 环境变量' },
      { status: 500 },
    );
  }

  const client = new OpenAI({
    apiKey,
    baseURL: apiBase,
  });

  try {
    const response = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(name, question, code) },
      ],
      temperature: 0.4,
      max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { success: false, error: 'AI 返回内容为空' },
        { status: 502 },
      );
    }

    const parsed = safeJsonParse(content);
    if (!parsed || typeof parsed !== 'object') {
      return NextResponse.json(
        {
          success: false,
          error: 'AI 返回结果无法解析为 JSON',
          raw: content.slice(0, 500),
        },
        { status: 502 },
      );
    }

    const obj = parsed as Record<string, unknown>;
    const understandingObj =
      (obj.understanding as Record<string, unknown> | undefined) ?? {};
    const logicObj = (obj.logic as Record<string, unknown> | undefined) ?? {};
    const readabilityObj =
      (obj.readability as Record<string, unknown> | undefined) ?? {};
    const syntaxObj = (obj.syntax as Record<string, unknown> | undefined) ?? {};

    const understanding = clamp(understandingObj.score, 0, 30);
    const logic = clamp(logicObj.score, 0, 25);
    const readability = clamp(readabilityObj.score, 0, 25);
    const syntax = clamp(syntaxObj.score, 0, 20);
    const total = understanding + logic + readability + syntax;

    const rawKnowledgePoints = Array.isArray(obj.knowledgePoints)
      ? (obj.knowledgePoints as unknown[])
          .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
          .map((v) => v.trim())
      : [];
    const knowledgePoints = matchKnowledgePoints(rawKnowledgePoints);

    const level =
      total >= 85
        ? '优秀'
        : total >= 70
          ? '良好'
          : total >= 60
            ? '及格'
            : '待提升';

    const hint = asString(
      obj.hint,
      '再读一遍自己的代码，重点关注条件判断和缩进，相信你能发现可以优化的地方。',
    );

    const practice = asString(
      obj.practice,
      '在原题基础上增加一个输入校验：当参数不合法时，打印提示并返回 0。',
    );

    const dbReport = JSON.stringify({
      understandingScore: understanding,
      logicScore: logic,
      readabilityScore: readability,
      syntaxScore: syntax,
      totalScore: total,
      level,
      hint,
      practice,
      knowledgePoints,
    });

    if (body.studentId) {
      addEvaluation({
        studentId: body.studentId,
        question,
        code,
        report: dbReport,
        score: total,
      });
    }

    const report = {
      studentName: name,
      dimensions: [
        {
          key: 'understanding',
          name: '题目理解与实现',
          score: understanding,
          full: 30,
          comment: asString(
            understandingObj.comment,
            '代码结构清晰，能围绕题目要求展开实现。',
          ),
          color: 'yellow' as const,
        },
        {
          key: 'logic',
          name: '逻辑思路',
          score: logic,
          full: 25,
          comment: asString(
            logicObj.comment,
            '整体思路合理，条件与循环使用得当。',
          ),
          color: 'green' as const,
        },
        {
          key: 'readability',
          name: '代码可读性',
          score: readability,
          full: 25,
          comment: asString(
            readabilityObj.comment,
            '命名、缩进、注释等可读性指标整体良好。',
          ),
          color: 'primary' as const,
        },
        {
          key: 'syntax',
          name: '语法掌握',
          score: syntax,
          full: 20,
          comment: asString(
            syntaxObj.comment,
            '本章节涉及的 Python 语法使用基本正确。',
          ),
          color: 'pink' as const,
        },
      ],
      totalScore: total,
      level,
      hint,
      practice,
      knowledgePoints,
    };

    return NextResponse.json({ success: true, report });
  } catch (e) {
    const message = e instanceof Error ? e.message : '调用 AI 失败';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}