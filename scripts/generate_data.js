const Database = require('better-sqlite3');
const path = require('path');

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
  'for 循环 — range () 单参数、双参数、三参数规则理解错误',
  'for 循环 — range () 起止数值、步长设置错误',
  'for 循环 — 遍历列表 / 字符串 / 字典时取值逻辑错误',
  'for 循环 — 循环体内语句范围划分错误（缩进问题衍生）',
  'for 循环 — 嵌套 for 循环内外层变量混淆',
  'while 循环 — 循环条件设置错误，引发死循环',
  'while 循环 — 循环变量未做自增 / 自减，无法退出循环',
  'while 循环 — 循环终止条件逻辑缺失',
  '循环通用关键字 — break 跳出循环使用场景错误',
  '循环通用关键字 — continue 跳过本次循环使用错误',
  '列表 — 创建列表方括号 [] 书写错误、元素分隔错误',
  '列表 — 列表索引越界，访问不存在的下标',
  '列表 — 正负索引混用、索引取值理解错误',
  '列表 — append () 末尾追加元素方法调用错误',
  '列表 — insert () 指定位置插入，下标参数错误',
  '列表 — pop () 删除元素下标、返回值理解错误',
  '列表 — remove () 按值删除，找不到元素引发异常',
  '列表 — del 语句删除列表 / 元素格式错误',
  '列表 — 遍历列表同时增删元素，逻辑异常',
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
  '函数 — def 关键字定义函数格式错误',
  '函数 — 函数名命名不规范（关键字、数字开头）',
  '函数 — 函数定义行括号、末尾冒号缺失',
  '函数 — 形参和实参数量不匹配',
  '函数 — 位置参数、关键字参数混用顺序错误',
  '函数 — 默认参数设置与调用错误',
  '函数 — return 返回值书写位置错误',
  '函数 — 无返回值函数强行接收返回结果',
  '函数 — 函数调用位置错误（先调用后定义）',
  '函数 — 函数内部、外部变量作用域理解错误',
  '异常处理 — try-except 语句格式、缩进错误',
  '异常处理 — 捕获异常类型书写错误',
  '异常处理 — except 后无异常类型，滥用捕获',
  '文件操作 — open () 函数路径、打开模式 r/w/a 书写错误',
  '文件操作 — 文件读写编码 encoding 参数缺失 / 错误',
  '文件操作 — read ()/readline () 读取文件内容用法错误',
  '文件操作 — 写入文件 write () 参数格式错误',
  '文件操作 — 打开文件后未执行关闭 close () 操作',
  '模块导入 — import 关键字书写错误',
  '模块导入 — from xxx import xxx 导入格式错误',
  '模块导入 — 导入模块后，调用方法语法错误',
  '代码结构 — 重复编写完全一致的语句，内容冗余',
  '代码结构 — 定义无效变量、声明无用语句',
  '代码结构 — 语句执行顺序颠倒，整体逻辑异常',
  '注释 — 单行注释 # 符号后无空格，格式不规范',
  '注释 — 多行注释三引号使用混乱',
  '注释 — 注释内容与代码不匹配，误导阅读',
  '注释 — 关键代码无注释、无效位置堆砌注释',
];

const QUESTIONS = [
  {
    title: '编写程序，输入圆的半径，计算并输出圆的面积',
    content: '编写程序，输入圆的半径，计算并输出圆的面积。圆周率取3.14。',
    easyCode: 'r = float(input("请输入圆的半径："))\npi = 3.14\narea = pi * r * r\nprint("圆的面积是：", area)',
    hardCode: 'r = input("请输入圆的半径：")\narea = 3.14 * r * r\nprint("面积", area)',
  },
  {
    title: '编写程序，判断一个数是奇数还是偶数',
    content: '编写程序，判断一个数是奇数还是偶数。',
    easyCode: 'num = int(input("请输入一个数字："))\nif num % 2 == 0:\n    print("偶数")\nelse:\n    print("奇数")',
    hardCode: 'num = 7\nif num % 2 = 0:\n    print("偶数")\nprint("奇数")',
  },
  {
    title: '编写程序，使用for循环输出1到10的所有数字',
    content: '编写程序，使用for循环输出1到10的所有数字。',
    easyCode: 'for i in range(1, 11):\n    print(i)',
    hardCode: 'for i in 1 to 10\n    print i',
  },
  {
    title: '编写程序，计算列表中所有元素的和',
    content: '编写程序，计算列表中所有元素的和。',
    easyCode: 'numbers = [1, 2, 3, 4, 5]\ntotal = 0\nfor num in numbers:\n    total += num\nprint(total)',
    hardCode: 'numbers = [1, 2, 3, 4, 5]\ntotal = 0\nfor num in numbers:\ntotal = total + num\nprint total',
  },
  {
    title: '编写程序，创建一个字典存储学生信息',
    content: '编写程序，创建一个字典存储学生信息，包含姓名、年龄、班级。',
    easyCode: 'student = {"name": "张三", "age": 18, "class": "计算机应用YB26"}\nprint(student)',
    hardCode: 'student = {"name": "张三", age: 18, "class": "计算机应用YB26"}\nprint student',
  },
  {
    title: '编写程序，计算两个数的乘积',
    content: '编写程序，定义一个函数计算两个数的乘积。',
    easyCode: 'def multiply(a, b):\n    return a * b\n\nresult = multiply(3, 5)\nprint(result)',
    hardCode: 'def multiply(a, b)\n    return a * b\n\nresult = multiply(3, 5)\nprint result',
  },
  {
    title: '编写程序，求1到100的所有奇数的和',
    content: '编写程序，求1到100的所有奇数的和。',
    easyCode: 'total = 0\nfor i in range(1, 101, 2):\n    total += i\nprint(total)',
    hardCode: 'total = 0\nfor i in range(1, 101):\n    if i % 2 != 0\n        total = total + i\nprint total',
  },
  {
    title: '编写程序，反转一个字符串',
    content: '编写程序，反转一个字符串。',
    easyCode: 's = "hello"\nreversed_s = s[::-1]\nprint(reversed_s)',
    hardCode: 's = "hello"\nreversed_s = reverse(s)\nprint(reversed_s)',
  },
];

function getRandomKps(count) {
  const shuffled = [...KNOWLEDGE_POINTS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function generateReport(score) {
  const understanding = Math.min(30, Math.floor(score * 0.3));
  const logic = Math.min(25, Math.floor((score - understanding) * 0.4));
  const readability = Math.min(25, Math.floor((score - understanding - logic) * 0.5));
  const syntax = Math.max(0, score - understanding - logic - readability);
  
  const level = score >= 85 ? '优秀' : score >= 70 ? '良好' : score >= 60 ? '及格' : '待提升';
  
  const hints = {
    excellent: '代码非常优秀，继续保持！',
    good: '代码结构良好，还有一些小改进空间。',
    pass: '代码基本正确，需要进一步优化。',
    poor: '代码需要认真检查，注意基本语法和逻辑。',
  };
  
  const hint = score >= 85 ? hints.excellent : score >= 70 ? hints.good : score >= 60 ? hints.pass : hints.poor;
  
  const kpCount = score >= 95 ? 1 : score >= 85 ? 2 : score >= 70 ? 3 : 4;
  
  return {
    understandingScore: understanding,
    logicScore: logic,
    readabilityScore: readability,
    syntaxScore: syntax,
    totalScore: score,
    level,
    hint,
    practice: '继续练习相关题目',
    knowledgePoints: getRandomKps(kpCount),
  };
}

const dbPath = path.join(process.cwd(), 'data', 'mscz.db');
const db = new Database(dbPath);

console.log('=== 步骤1: 删除所有聊天消息 ===');
const deleteMessages = db.prepare('DELETE FROM chat_messages').run();
console.log(`删除了 ${deleteMessages.changes} 条聊天消息`);

console.log('\n=== 步骤2: 删除所有聊天会话 ===');
const deleteConversations = db.prepare('DELETE FROM chat_conversations').run();
console.log(`删除了 ${deleteConversations.changes} 条聊天会话`);

console.log('\n=== 步骤3: 删除所有评价记录 ===');
const deleteEvaluations = db.prepare('DELETE FROM evaluations').run();
console.log(`删除了 ${deleteEvaluations.changes} 条评价记录`);

console.log('\n=== 步骤4: 修改学生学号 ===');

const studentUpdates = [
  { oldId: '41', newId: '11', name: '程赛' },
  { oldId: '42', newId: '12', name: '韩泽凯' },
  { oldId: '43', newId: '13', name: '何锡洲' },
  { oldId: '44', newId: '14', name: '胡洽恺' },
  { oldId: '45', newId: '41', name: '黄惠燕' },
  { oldId: '46', newId: '42', name: '黄遂娟' },
  { oldId: '47', newId: '43', name: '王雪莲' },
];

studentUpdates.forEach(update => {
  const result = db.prepare('UPDATE students SET student_id = ? WHERE student_id = ?').run(update.newId, update.oldId);
  if (result.changes > 0) {
    console.log(`${update.name}: ${update.oldId} -> ${update.newId}`);
  } else {
    console.log(`${update.name}: ${update.oldId} -> ${update.newId} (未找到记录)`);
  }
});

console.log('\n=== 步骤5: 生成新的测试数据 ===');

const students = db.prepare('SELECT student_id, name FROM students WHERE student_id IS NOT NULL').all();
console.log(`共有 ${students.length} 名学生`);

let totalRecords = 0;
const now = new Date();

students.forEach(student => {
  if (!student.student_id || !student.name) {
    console.log(`跳过无效学生记录:`, student);
    return;
  }
  
  console.log(`\n正在为 ${student.name} (${student.student_id}) 生成记录...`);
  
  for (let i = 0; i < 8; i++) {
    const questionIndex = i % QUESTIONS.length;
    const question = QUESTIONS[questionIndex];
    
    const isHard = Math.random() > 0.6;
    const code = isHard ? question.hardCode : question.easyCode;
    
    let score;
    if (isHard) {
      score = Math.floor(Math.random() * 25) + 50;
    } else {
      score = Math.floor(Math.random() * 20) + 80;
    }
    
    const report = generateReport(score);
    const reportStr = JSON.stringify(report);
    
    const createdAt = new Date(now.getTime() - totalRecords * 300000).toISOString();
    
    db.prepare('INSERT INTO evaluations (student_id, question, code, report, score, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(student.student_id, question.title, code, reportStr, score, createdAt);
    
    totalRecords++;
    
    if (score < 80) {
      const fixedScore = Math.floor(Math.random() * 5) + 95;
      const fixedReport = generateReport(fixedScore);
      const fixedReportStr = JSON.stringify(fixedReport);
      
      const fixedCode = question.easyCode + '\n# 修正后的代码';
      
      const fixedCreatedAt = new Date(now.getTime() - totalRecords * 300000).toISOString();
      
      db.prepare('INSERT INTO evaluations (student_id, question, code, report, score, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run(student.student_id, question.title, fixedCode, fixedReportStr, fixedScore, fixedCreatedAt);
      
      totalRecords++;
      console.log(`  记录 ${i + 1}: 成绩 ${score} 分（已生成修正记录，成绩 ${fixedScore} 分）`);
    } else {
      console.log(`  记录 ${i + 1}: 成绩 ${score} 分`);
    }
  }
});

console.log(`\n=== 完成 ===`);
console.log(`共生成 ${totalRecords} 条评价记录`);

db.close();
