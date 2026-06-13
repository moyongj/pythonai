const sqlite3 = require('sqlite3').verbose();

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

const surnames = ['李', '王', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '马', '朱', '胡', '郭', '何', '林', '罗', '高'];
const givenNames = ['明', '芳', '伟', '强', '敏', '静', '磊', '婷', '涛', '燕', '浩', '丽', '鹏', '杰', '晴', '波', '琴', '雪', '峰', '华'];

function generateStudentNames(count) {
  const names = [];
  for (let i = 0; i < count; i++) {
    const surname = surnames[i % surnames.length];
    const givenName = givenNames[i % givenNames.length] + (i >= surnames.length ? Math.floor(i / surnames.length).toString() : '');
    names.push(surname + givenName);
  }
  return names;
}

const questions = [
  '使用 while 循环，输出 1-10',
  '遍历列表 nums = [12, 5, 8, 3, 9]，计算所有元素的和',
  '定义一个函数，求两个数的最大值',
  '判断一个数是否为偶数',
  '计算 1 到 100 的累加和',
  '字符串反转',
  '阶乘计算',
  '冒泡排序',
  '回文判断',
  '列表去重',
  '计算圆的面积',
  '温度转换（摄氏度转华氏度）',
  '简单计算器（加减乘除）',
  '判断闰年',
  '打印九九乘法表'
];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateBadCode() {
  const templates = [
    `# 计算求和 - 有缩进错误\nnums = [1, 2, 3, 4, 5]\ntotal = 0\nfor num in nums:\ntotal += num\nprint(total)`,
    `# 判断偶数 - 有语法错误\nn = int(input("请输入数字："))\nif n % 2 = 0:\n    print("偶数")\nelse\n    print("奇数")`,
    `# while 循环 - 死循环\ncount = 1\nwhile count <= 10:\n    print(count)`,
    `# 函数定义 - 缺少冒号\ndef add(a, b)\n    return a + b\nresult = add(3, 5)\nprint(result)`,
    `# 列表操作 - 索引越界\nfruits = ["apple", "banana", "cherry"]\nprint(fruits[5])`,
    `# 变量未定义\nfor i in range(5):\n    print(count)`,
    `# 字符串拼接错误\nage = 18\nprint("年龄：" + age)`,
    `# 条件判断 == 写成 =\nnumber = 10\nif number = 10:\n    print("是10")`,
  ];
  return getRandomItem(templates);
}

function generateGoodCode() {
  const templates = [
    `# 计算求和\nnums = [1, 2, 3, 4, 5]\ntotal = 0\nfor num in nums:\n    total += num\nprint(total)`,
    `# 判断偶数\nn = int(input("请输入数字："))\nif n % 2 == 0:\n    print("偶数")\nelse:\n    print("奇数")`,
    `# while 循环\ncount = 1\nwhile count <= 10:\n    print(count)\n    count += 1`,
    `# 函数定义\ndef add(a, b):\n    return a + b\nresult = add(3, 5)\nprint(result)`,
    `# 列表操作\nfruits = ["apple", "banana", "cherry"]\nfor fruit in fruits:\n    print(fruit)`,
    `# 字符串拼接\nage = 18\nprint("年龄：" + str(age))`,
    `# 条件判断\nnumber = 10\nif number == 10:\n    print("是10")`,
  ];
  return getRandomItem(templates);
}

function getRandomKps(count) {
  const kps = [];
  const usedIndices = new Set();
  while (kps.length < count) {
    const idx = Math.floor(Math.random() * KNOWLEDGE_POINTS.length);
    if (!usedIndices.has(idx)) {
      usedIndices.add(idx);
      kps.push(KNOWLEDGE_POINTS[idx]);
    }
  }
  return kps;
}

function generateStudentRecords(name, question, baseDate) {
  const records = [];
  
  let badTotal = 0;
  let badUnderstanding, badLogic, badReadability, badSyntax;
  
  while (badTotal < 51 || badTotal > 84) {
    badUnderstanding = getRandomInt(15, 28);
    badLogic = getRandomInt(12, 23);
    badReadability = getRandomInt(10, 23);
    badSyntax = getRandomInt(8, 18);
    badTotal = badUnderstanding + badLogic + badReadability + badSyntax;
  }
  
  let badLevel;
  if (badTotal >= 85) badLevel = '优秀';
  else if (badTotal >= 70) badLevel = '良好';
  else if (badTotal >= 60) badLevel = '及格';
  else badLevel = '待提升';
  
  const badKps = getRandomKps(getRandomInt(1, 3));
  
  const badDate = new Date(baseDate);
  badDate.setMinutes(badDate.getMinutes() - getRandomInt(30, 60));
  
  records.push({
    name,
    question,
    code: generateBadCode(),
    understanding: badUnderstanding,
    logic: badLogic,
    readability: badReadability,
    syntax: badSyntax,
    total: badTotal,
    level: badLevel,
    kps: badKps,
    createdAt: badDate.toISOString(),
    isImprovement: false,
  });
  
  let goodTotal = 0;
  let goodUnderstanding, goodLogic, goodReadability, goodSyntax;
  
  while (goodTotal < 85 || goodTotal > 100) {
    goodUnderstanding = getRandomInt(26, 30);
    goodLogic = getRandomInt(22, 25);
    goodReadability = getRandomInt(21, 25);
    goodSyntax = getRandomInt(17, 20);
    goodTotal = goodUnderstanding + goodLogic + goodReadability + goodSyntax;
  }
  
  const goodKps = badKps.slice(0, 1);
  
  const goodDate = new Date(baseDate);
  
  records.push({
    name,
    question,
    code: generateGoodCode(),
    understanding: goodUnderstanding,
    logic: goodLogic,
    readability: goodReadability,
    syntax: goodSyntax,
    total: goodTotal,
    level: '优秀',
    kps: goodKps,
    createdAt: goodDate.toISOString(),
    isImprovement: true,
  });
  
  return records;
}

const db = new sqlite3.Database('./data/evaluations.db');
const studentCount = 136;
const studentNames = generateStudentNames(studentCount);

db.run(`DELETE FROM evaluation_records`, (err) => {
  if (err) {
    console.error('清空表失败:', err);
    process.exit(1);
  }
  
  const allRecords = [];
  const baseDate = new Date();
  
  for (let i = 0; i < studentNames.length; i++) {
    const name = studentNames[i];
    const question = getRandomItem(questions);
    const studentRecords = generateStudentRecords(name, question, baseDate);
    allRecords.push(...studentRecords);
    baseDate.setMinutes(baseDate.getMinutes() - getRandomInt(60, 120));
  }
  
  allRecords.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  let count = 0;
  allRecords.forEach((record) => {
    db.run(
      `INSERT INTO evaluation_records (
        student_name, question, code, understanding_score, logic_score,
        readability_score, syntax_score, total_score, level, hint,
        practice, knowledge_points, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.name,
        record.question,
        record.code,
        record.understanding,
        record.logic,
        record.readability,
        record.syntax,
        record.total,
        record.level,
        record.isImprovement ? '非常好！继续保持！' : '注意改进代码中的问题',
        '尝试挑战更复杂的题目',
        JSON.stringify(record.kps),
        record.createdAt
      ],
      (err) => {
        if (err) {
          console.error('插入失败:', err);
        } else {
          count++;
          if (count % 50 === 0) {
            console.log(`已插入 ${count} 条记录`);
          }
          if (count === allRecords.length) {
            console.log(`\n成功插入 ${count} 条测试数据！`);
            console.log(`共 ${studentCount} 位学生，每位学生 2 条记录`);
            console.log(`第一条记录：51-84 分`);
            console.log(`第二条记录：85-100 分（优秀）`);
            db.close();
          }
        }
      }
    );
  });
});