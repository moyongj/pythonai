'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import {
  Activity,
  Trophy,
  Star,
  Lightbulb,
  BarChart3,
  TrendingUp,
  Code,
  Quote,
  Sparkles,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Search,
  X,
  LogOut,
  Users,
  FileText,
  ShieldCheck,
  BookOpen,
  Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateSession, logout, getEvaluations, getStudents, type Student, type EvaluationRecord } from '@/lib/auth';
import { Footer } from '@/components/footer';

interface Summary {
  totalCount: number;
  avgScore: number;
  excellentRate: number;
  kpCount: number;
}

interface DistributionItem {
  range: string;
  count: number;
  color: string;
  text: string;
}

interface TopKpItem {
  name: string;
  count: number;
}

interface RecentRecord {
  id: number;
  name: string;
  studentId: string;
  class: string;
  title: string;
  score: number;
  level: string;
  time: string;
}

interface DimensionStats {
  understanding: number;
  logic: number;
  readability: number;
  syntax: number;
}

const WORDCLOUD = [
  { text: 'if 判断', size: 'text-2xl', weight: 'font-extrabold', color: 'text-primary' },
  { text: 'for 循环', size: 'text-xl', weight: 'font-bold', color: 'text-accent-pink' },
  { text: 'while 循环', size: 'text-lg', weight: 'font-bold', color: 'text-accent-green' },
  { text: '变量命名', size: 'text-2xl', weight: 'font-extrabold', color: 'text-amber-700' },
  { text: '缩进', size: 'text-base', weight: 'font-semibold', color: 'text-primary' },
  { text: 'print', size: 'text-lg', weight: 'font-bold', color: 'text-accent-pink' },
  { text: 'input', size: 'text-base', weight: 'font-semibold', color: 'text-accent-green' },
  { text: '列表', size: 'text-xl', weight: 'font-bold', color: 'text-primary' },
  { text: '字典', size: 'text-base', weight: 'font-semibold', color: 'text-amber-700' },
  { text: '函数定义', size: 'text-lg', weight: 'font-bold', color: 'text-accent-pink' },
  { text: '返回值', size: 'text-base', weight: 'font-semibold', color: 'text-primary' },
  { text: '字符串', size: 'text-xl', weight: 'font-bold', color: 'text-accent-green' },
];

/**
 * 根据等级获取徽章样式
 */
function levelBadgeClass(level: string): string {
  if (level === '优秀') return 'bg-accent-green/15 text-accent-green';
  if (level === '良好') return 'bg-primary/15 text-primary';
  if (level === '及格') return 'bg-accent-yellow/20 text-amber-700';
  return 'bg-destructive/15 text-destructive';
}

/**
 * 环形进度条组件
 */
function RingProgress({
  percent,
  color,
  label,
  value,
}: {
  percent: number;
  color: string;
  label: string;
  value: string;
}) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const dash = (percent / 100) * circumference;
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative h-24 w-24">
        <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} stroke="currentColor" strokeWidth="8" fill="none" className="text-muted" />
          <circle cx="50" cy="50" r={radius} stroke={color} strokeWidth="8" strokeLinecap="round" fill="none" strokeDasharray={circumference} strokeDashoffset={circumference - dash} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-foreground">{percent.toFixed(1)}%</span>
        </div>
      </div>
      <div className="mt-2 text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-bold text-foreground">{value}</div>
    </div>
  );
}

/**
 * 管理员学情统计页面组件
 * 展示所有学生的学习数据统计和分析
 */
export default function AdminStatisticsPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary>({ totalCount: 0, avgScore: 0, excellentRate: 0, kpCount: 112 });
  const [distribution, setDistribution] = useState<DistributionItem[]>([]);
  const [topKp, setTopKp] = useState<TopKpItem[]>([]);
  const [recentRecords, setRecentRecords] = useState<RecentRecord[]>([]);
  const [dimensionStats, setDimensionStats] = useState<DimensionStats>({ understanding: 25, logic: 21, readability: 20, syntax: 16 });
  const [showSearch, setShowSearch] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    studentName: '',
    className: '',
    minScore: '',
    maxScore: '',
  });
  const [classes, setClasses] = useState<string[]>([]);
  const [exportType, setExportType] = useState<string>('all');
  const [students, setStudents] = useState<Student[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluationRecord[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filteredEvaluations, setFilteredEvaluations] = useState<EvaluationRecord[]>([]);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportProgress, setReportProgress] = useState(0);

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

      const [evals, studentsData] = await Promise.all([
        getEvaluations(),
        getStudents(),
      ]);
      setEvaluations(evals);
      setStudents(studentsData);
      const uniqueClasses = Array.from(new Set(studentsData.map(s => s.class))).sort();
      setClasses(uniqueClasses);
      updateStats(evals, studentsData);
      setLoading(false);
    };
    initPage();
  }, [router]);

  /**
   * 更新统计数据
   */
  const updateStats = (evals: EvaluationRecord[], studentsData: Student[]) => {
    const scores = evals.map(e => e.score);
    const totalCount = evals.length;
    const avgScore = totalCount > 0 ? scores.reduce((a, b) => a + b, 0) / totalCount : 0;
    const excellentCount = scores.filter(s => s >= 85).length;
    const excellentRate = totalCount > 0 ? (excellentCount / totalCount) * 100 : 0;

    setSummary({
      totalCount,
      avgScore: parseFloat(avgScore.toFixed(1)),
      excellentRate: parseFloat(excellentRate.toFixed(1)),
      kpCount: 112,
    });

    setDistribution([
      { range: '85-100', count: scores.filter(s => s >= 85).length, color: 'bg-accent-pink', text: 'text-accent-pink' },
      { range: '70-84', count: scores.filter(s => s >= 70 && s < 85).length, color: 'bg-accent-green', text: 'text-accent-green' },
      { range: '60-69', count: scores.filter(s => s >= 60 && s < 70).length, color: 'bg-primary', text: 'text-primary' },
      { range: '0-59', count: scores.filter(s => s < 60).length, color: 'bg-destructive', text: 'text-destructive' },
    ]);

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

    const kpFrequency: Record<string, number> = {};
    const kpCategories: Record<string, { subItems: { name: string; count: number }[]; totalCount: number }> = {};

    let totalUnderstanding = 0;
    let totalLogic = 0;
    let totalReadability = 0;
    let totalSyntax = 0;
    let dimCount = 0;

    const parseReport = (reportStr: string) => {
      try {
        return JSON.parse(reportStr);
      } catch {
        try {
          const jsonStr = reportStr
            .replace(/'/g, '"')
            .replace(/"(\w+)":/g, '"$1":');
          return JSON.parse(jsonStr);
        } catch {
          return null;
        }
      }
    };

    evals.forEach(evalRecord => {
      try {
        const report = parseReport(evalRecord.report);
        if (!report) return;

        if (Array.isArray(report.dimensions)) {
          report.dimensions.forEach((dim: any) => {
            if (dim && typeof dim.score === 'number') {
              const key = dim.key || dim.name;
              if (key === 'understanding') totalUnderstanding += dim.score;
              else if (key === 'logic') totalLogic += dim.score;
              else if (key === 'readability') totalReadability += dim.score;
              else if (key === 'syntax') totalSyntax += dim.score;
              dimCount++;
            }
          });
        } else if (typeof report.understandingScore === 'number') {
          // 数据库 report JSON 真实结构：understandingScore / logicScore / readabilityScore / syntaxScore
          totalUnderstanding += report.understandingScore;
          totalLogic += report.logicScore || 0;
          totalReadability += report.readabilityScore || 0;
          totalSyntax += report.syntaxScore || 0;
          dimCount++;
        } else if (typeof report.understanding === 'number') {
          // 兼容旧结构：understanding / logic / readability / syntax
          totalUnderstanding += report.understanding;
          totalLogic += report.logic || 0;
          totalReadability += report.readability || 0;
          totalSyntax += report.syntax || 0;
          dimCount++;
        }

        const knowledgePoints = report.knowledgePoints || [];
        knowledgePoints.forEach((kp: string) => {
          if (typeof kp === 'string' && kp.trim().length > 0) {
            const cleanKp = kp.trim();
            kpFrequency[cleanKp] = (kpFrequency[cleanKp] || 0) + 1;
            
            const parts = cleanKp.split(' — ');
            if (parts.length >= 2) {
              const category = parts[0].trim();
              const subItem = parts.slice(1).join(' — ').trim();
              if (!kpCategories[category]) {
                kpCategories[category] = { subItems: [], totalCount: 0 };
              }
              const existingSubItem = kpCategories[category].subItems.find(s => s.name === subItem);
              if (existingSubItem) {
                existingSubItem.count++;
              } else {
                kpCategories[category].subItems.push({ name: subItem, count: 1 });
              }
              kpCategories[category].totalCount++;
            } else {
              const category = cleanKp;
              if (!kpCategories[category]) {
                kpCategories[category] = { subItems: [], totalCount: 0 };
              }
              kpCategories[category].totalCount++;
            }
          }
        });
      } catch {
        // 忽略解析失败的记录
      }
    });

    const extractedTopKp = Object.entries(kpCategories)
      .map(([category, data]) => {
        const sortedSubItems = data.subItems.sort((a, b) => b.count - a.count);
        let name: string;
        if (sortedSubItems.length > 0) {
          const firstLineItems = sortedSubItems.slice(0, 2);
          const secondLineItems = sortedSubItems.slice(2, 4);
          let subItemsText = firstLineItems.map(s => s.name).join('、');
          if (secondLineItems.length > 0) {
            subItemsText += '\n' + secondLineItems.map(s => s.name).join('、');
            if (sortedSubItems.length > 4) {
              subItemsText += `等${sortedSubItems.length}项`;
            }
          }
          name = `${category}——${subItemsText}`;
        } else {
          name = category;
        }
        return { name, count: data.totalCount };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    if (extractedTopKp.length === 0) {
      setTopKp([
        { name: '字典——创建字典大括号{}书写错误', count: 10 },
        { name: 'for 循环——遍历列表/字符串', count: 10 },
        { name: '字符串——切片起始/结束索引设置错误', count: 8 },
        { name: '元组——单元素元组末尾缺失逗号', count: 8 },
        { name: '列表——insert() 指定位置插入', count: 8 },
      ]);
    } else {
      setTopKp(extractedTopKp);
    }

    if (dimCount > 0) {
      setDimensionStats({
        understanding: parseFloat((totalUnderstanding / dimCount).toFixed(1)),
        logic: parseFloat((totalLogic / dimCount).toFixed(1)),
        readability: parseFloat((totalReadability / dimCount).toFixed(1)),
        syntax: parseFloat((totalSyntax / dimCount).toFixed(1)),
      });
    }

    setFilteredEvaluations(evals);
    setTotalPages(Math.ceil(evals.length / 10));
    setCurrentPage(1);
    updateRecentRecords(evals, studentsData, 1);
  };

  const updateRecentRecords = (evals: EvaluationRecord[], studentsData: Student[], page: number) => {
    const start = (page - 1) * 10;
    const end = start + 10;
    setRecentRecords(evals.slice(start, end).map(e => {
      const student = studentsData.find(s => s.studentId === e.studentId);
      const level = e.score >= 85 ? '优秀' : e.score >= 70 ? '良好' : e.score >= 60 ? '及格' : '待提升';
      return {
        id: e.id,
        name: student?.name || '未知学生',
        studentId: student?.studentId || '',
        class: student?.class || '',
        title: e.question.substring(0, 30) + (e.question.length > 30 ? '...' : ''),
        score: e.score,
        level,
        time: new Date(e.createdAt).toLocaleString(),
      };
    }));
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      updateRecentRecords(filteredEvaluations, students, page);
    }
  };

  /**
   * 处理退出登录
   */
  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  /**
   * 处理搜索筛选
   */
  const handleSearch = () => {
    let filtered = evaluations;
    if (searchFilters.studentName) {
      filtered = filtered.filter(e => {
        const student = students.find(s => s.studentId === e.studentId);
        return student?.name.includes(searchFilters.studentName);
      });
    }
    if (searchFilters.className) {
      filtered = filtered.filter(e => {
        const student = students.find(s => s.studentId === e.studentId);
        return student?.class === searchFilters.className;
      });
    }
    if (searchFilters.minScore) filtered = filtered.filter(e => e.score >= parseInt(searchFilters.minScore));
    if (searchFilters.maxScore) filtered = filtered.filter(e => e.score <= parseInt(searchFilters.maxScore));
    updateStats(filtered, students);
  };

  /**
   * 生成带时间戳的文件名
   */
  const generateFileName = (prefix: string, suffix: string = '.csv') => {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:T]/g, '-').slice(0, 19);
    return `${prefix}_${timestamp}${suffix}`;
  };

  /**
   * 导出学情记录为Excel（支持多工作表）
   */
  const handleExport = (exportTypeParam: 'all' | 'class' | 'student') => {
    const headers = ['序号', '学生姓名', '学号', '班级', '题目', '总分', '等级', '评价时间', '易错知识点'];
    
    const workbook = XLSX.utils.book_new();
    
    const allRecords = filteredEvaluations.map(e => {
      const student = students.find(s => s.studentId === e.studentId);
      const level = e.score >= 85 ? '优秀' : e.score >= 70 ? '良好' : e.score >= 60 ? '及格' : '待提升';
      
      let knowledgePoints = '';
      try {
        const report = typeof e.report === 'string' ? JSON.parse(e.report) : e.report;
        if (report?.knowledgePoints && Array.isArray(report.knowledgePoints)) {
          knowledgePoints = report.knowledgePoints.join('、');
        }
      } catch {
        knowledgePoints = '';
      }
      
      return {
        name: student?.name || '未知',
        studentId: student?.studentId || '',
        class: student?.class || '',
        title: e.question || '',
        score: e.score,
        level,
        time: new Date(e.createdAt).toLocaleString('zh-CN'),
        knowledgePoints
      };
    });
    
    if (exportTypeParam === 'class') {
      const classGroups = allRecords.reduce((groups, record) => {
        const className = record.class || '未知班级';
        if (!groups[className]) {
          groups[className] = [];
        }
        groups[className].push(record);
        return groups;
      }, {} as Record<string, typeof allRecords>);
      
      Object.entries(classGroups).forEach(([className, records]) => {
        const sheetData = [headers].concat(
          records.map((r, idx) => [
            (idx + 1).toString(),
            r.name,
            r.studentId,
            r.class,
            r.title,
            r.score.toString(),
            r.level,
            r.time,
            r.knowledgePoints || ''
          ])
        );
        const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(workbook, worksheet, className.slice(0, 31));
      });
      
      XLSX.writeFile(workbook, generateFileName('按班级_学情记录') + '.xlsx');
    } else if (exportTypeParam === 'student') {
      const studentGroups = allRecords.reduce((groups, record) => {
        const studentName = record.name || '未知学生';
        if (!groups[studentName]) {
          groups[studentName] = [];
        }
        groups[studentName].push(record);
        return groups;
      }, {} as Record<string, typeof allRecords>);
      
      Object.entries(studentGroups).forEach(([studentName, records]) => {
        const sheetData = [headers].concat(
          records.map((r, idx) => [
            (idx + 1).toString(),
            r.name,
            r.studentId,
            r.class,
            r.title,
            r.score.toString(),
            r.level,
            r.time,
            r.knowledgePoints || ''
          ])
        );
        const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(workbook, worksheet, studentName.slice(0, 31));
      });
      
      XLSX.writeFile(workbook, generateFileName('按学生_学情记录') + '.xlsx');
    } else {
      const sheetData = [headers].concat(
        allRecords.map((r, idx) => [
          (idx + 1).toString(),
          r.name,
          r.studentId,
          r.class,
          r.title,
          r.score.toString(),
          r.level,
          r.time,
          r.knowledgePoints || ''
        ])
      );
      const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
      XLSX.utils.book_append_sheet(workbook, worksheet, '全部记录');
      XLSX.writeFile(workbook, generateFileName('全部学情记录') + '.xlsx');
    }
  };

  /**
   * 一键生成学情诊断报告（带平滑进度条动画）
   */
  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    setReportProgress(0);

    let currentProgress = 0;
    let stopAnimation = false;

    /**
     * 平滑动画：每个80ms增长，直到达到目标值，进度始终为整数
     */
    const animateTo = (target: number, speed: number = 2) => {
      return new Promise<void>((resolve) => {
        const timer = setInterval(() => {
          if (stopAnimation) {
            clearInterval(timer);
            resolve();
            return;
          }
          currentProgress = Math.min(Math.round(currentProgress + speed), target);
          setReportProgress(currentProgress);
          if (currentProgress >= target) {
            clearInterval(timer);
            resolve();
          }
        }, 80);
      });
    };

    try {
      // 阶段1: 准备请求 (0 -> 25%)
      await animateTo(25, 2);

      // 阶段2: 发起API请求
      const fetchPromise = fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evaluations: filteredEvaluations,
          students,
          filters: searchFilters,
        })
      });

      // 并行：等待请求响应的同时，进度条缓慢增长到 70%
      const [response] = await Promise.all([
        fetchPromise,
        animateTo(70, 1)
      ]);

      if (!response.ok) {
        throw new Error('生成报告失败');
      }

      // 阶段3: 处理响应数据 (70 -> 90%)
      const blobPromise = response.blob();
      await Promise.all([
        blobPromise,
        animateTo(90, 2)
      ]);

      const blob = await blobPromise;

      // 阶段4: 触发下载 (90 -> 100%)
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Learning_Report_${new Date().toISOString().slice(0,10)}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      await animateTo(100, 3);
      toast.success('学情诊断报告生成成功！');
    } catch (error) {
      console.error('生成报告失败:', error);
      toast.error('生成报告失败，请稍后重试');
    } finally {
      stopAnimation = true;
      setTimeout(() => {
        setGeneratingReport(false);
        setReportProgress(0);
      }, 1000);
    }
  };

  /**
   * 导出单个易错知识点统计
   */
  const handleExportSingleKp = (kp: TopKpItem) => {
    const csv = [['知识点名称', '出现次数'], [kp.name, kp.count.toString()]]
      .map(row => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = generateFileName(`易错知识点_${kp.name.slice(0, 10)}`);
    link.click();
  };

  /**
   * 导出全部易错知识点（包含详细测评记录）
   */
  const handleExportKp = () => {
    const headers = ['序号', '学生姓名', '学号', '班级', '成绩', '评价时间', '易错知识点'];
    
    const workbook = XLSX.utils.book_new();
    
    const sheetData = [headers].concat(
      filteredEvaluations.map((evalRecord, idx) => {
        const student = students.find(s => s.studentId === evalRecord.studentId);
        const studentName = student?.name || '未知';
        const studentId = student?.studentId || '';
        const className = student?.class || '';
        
        let knowledgePoints = '';
        try {
          const report = typeof evalRecord.report === 'string' ? JSON.parse(evalRecord.report) : evalRecord.report;
          if (report?.knowledgePoints && Array.isArray(report.knowledgePoints)) {
            knowledgePoints = report.knowledgePoints.join('、');
          }
        } catch {
          knowledgePoints = '';
        }
        
        return [
          (idx + 1).toString(),
          studentName,
          studentId,
          className,
          evalRecord.score.toString(),
          new Date(evalRecord.createdAt).toLocaleString('zh-CN'),
          knowledgePoints
        ];
      })
    );
    
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, '易错知识点记录');
    XLSX.writeFile(workbook, generateFileName('易错知识点测评记录') + '.xlsx');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const maxCount = Math.max(...distribution.map((d) => d.count), 1);

  const SUMMARY = [
    { label: '总评价次数', value: summary.totalCount.toString(), suffix: '次', icon: Activity, bg: 'bg-primary/10', text: 'text-primary' },
    { label: '平均分', value: summary.avgScore.toString(), suffix: '分', icon: Trophy, bg: 'bg-accent-yellow/15', text: 'text-amber-700' },
    { label: '优秀率', value: summary.excellentRate.toString(), suffix: '%', icon: Star, bg: 'bg-accent-green/15', text: 'text-accent-green' },
    { label: '易错知识点', value: summary.kpCount.toString(), suffix: '个', icon: Lightbulb, bg: 'bg-accent-pink/15', text: 'text-accent-pink' },
  ];

  const DIMENSIONS = [
    { name: '题目理解与实现', score: dimensionStats.understanding, full: 30, ring: '#FFD166' },
    { name: '逻辑思路', score: dimensionStats.logic, full: 25, ring: '#55C59D' },
    { name: '代码可读性', score: dimensionStats.readability, full: 25, ring: '#5B6CFF' },
    { name: '语法掌握', score: dimensionStats.syntax, full: 20, ring: '#FF7AB6' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary sm:w-6 sm:h-6" />
              <span className="text-base font-bold text-foreground sm:text-lg">管理员后台</span>
            </div>
            <nav className="hidden md:flex items-center gap-1 sm:gap-2">
              <button onClick={() => router.push('/admin?tab=students')} className={cn(
                'flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors sm:px-3 sm:py-2 sm:text-sm',
                'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}>
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                学生管理
              </button>
              <button onClick={() => router.push('/admin?tab=questions')} className={cn(
                'flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors sm:px-3 sm:py-2 sm:text-sm',
                'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}>
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                题库管理
              </button>
              <button onClick={() => router.push('/admin?tab=evaluations')} className={cn(
                'flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors sm:px-3 sm:py-2 sm:text-sm',
                'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}>
                <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                学情记录
              </button>
              <button className={cn(
                'flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium sm:px-3 sm:py-2 sm:text-sm',
                'bg-primary text-primary-foreground'
              )}>
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                学情分析
              </button>
              <a href="/admin/resources" className={cn(
                'flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors sm:px-3 sm:py-2 sm:text-sm',
                'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}>
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
            <button onClick={() => { router.push('/admin?tab=students'); setMobileMenuOpen(false); }} className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted">
              <Users className="w-4 h-4" />
              学生管理
            </button>
            <button onClick={() => { router.push('/admin?tab=questions'); setMobileMenuOpen(false); }} className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted">
              <FileText className="w-4 h-4" />
              题库管理
            </button>
            <button onClick={() => { router.push('/admin?tab=evaluations'); setMobileMenuOpen(false); }} className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted">
              <BarChart3 className="w-4 h-4" />
              学情记录
            </button>
            <button onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm font-medium bg-primary/10 text-primary">
              <TrendingUp className="w-4 h-4" />
              学情分析
            </button>
            <a href="/admin/resources" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted">
              <BookOpen className="w-4 h-4" />
              学习资源
            </a>
          </nav>
        )}
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-foreground sm:text-xl md:text-2xl">学情统计</h1>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">所有学生的学习数据分析汇总</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={cn(
                'flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors sm:px-4 sm:py-2 sm:text-sm',
                showSearch
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground hover:bg-muted/80'
              )}
            >
              <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {showSearch ? '隐藏搜索' : '搜索筛选'}
            </button>
            <button
              onClick={() => handleGenerateReport()}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-float transition-all hover:opacity-90 sm:px-4 sm:py-2 sm:text-sm"
            >
              <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              一键生成学情诊断报告
            </button>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleExport('all')}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent-green px-3 py-1.5 text-xs font-semibold text-white shadow-float transition-all hover:opacity-90 sm:px-4 sm:py-2 sm:text-sm"
              >
                <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                导出全部
              </button>
              <button
                onClick={() => handleExport('class')}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-all hover:bg-muted sm:px-4 sm:py-2 sm:text-sm"
              >
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                按班级导出
              </button>
              <button
                onClick={() => handleExport('student')}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-all hover:bg-muted sm:px-4 sm:py-2 sm:text-sm"
              >
                <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                按学生导出
              </button>
            </div>
          </div>
        </div>

        {showSearch && (
          <div className="rounded-xl bg-card p-4 shadow-card sm:p-5">
            <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground sm:mb-4 sm:text-base">
              <Search className="h-3.5 w-3.5 text-primary sm:h-4 sm:w-4" />
              搜索筛选
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground sm:text-sm">学生姓名</label>
                <input
                  type="text"
                  value={searchFilters.studentName}
                  onChange={(e) => setSearchFilters({ ...searchFilters, studentName: e.target.value })}
                  placeholder="输入学生姓名"
                  className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 sm:px-3 sm:py-2 sm:text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground sm:text-sm">班级</label>
                <select
                  value={searchFilters.className}
                  onChange={(e) => setSearchFilters({ ...searchFilters, className: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 sm:px-3 sm:py-2 sm:text-sm"
                >
                  <option value="">全部班级</option>
                  {classes.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground sm:text-sm">最低分数</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={searchFilters.minScore}
                  onChange={(e) => setSearchFilters({ ...searchFilters, minScore: e.target.value })}
                  placeholder="0"
                  className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 sm:px-3 sm:py-2 sm:text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground sm:text-sm">最高分数</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={searchFilters.maxScore}
                  onChange={(e) => setSearchFilters({ ...searchFilters, maxScore: e.target.value })}
                  placeholder="100"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 sm:mt-4">
              <button
                onClick={handleSearch}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-float transition-all hover:opacity-90 sm:px-4 sm:py-2 sm:text-sm"
              >
                <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                搜索
              </button>
              <button
                onClick={async () => {
                  setSearchFilters({ studentName: '', className: '', minScore: '', maxScore: '' });
                  const [evals, studentsData] = await Promise.all([getEvaluations(), getStudents()]);
                  updateStats(evals, studentsData);
                }}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted/80 sm:px-4 sm:py-2 sm:text-sm"
              >
                <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                清除
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SUMMARY.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-card transition-transform hover:-translate-y-0.5 sm:p-4 lg:p-5">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg sm:h-12 sm:w-12', item.bg)}>
                  <Icon className={cn('h-5 w-5 sm:h-6 sm:w-6', item.text)} />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{item.label}</div>
                  <div className="mt-0.5 flex items-baseline gap-1">
                    <span className="text-lg font-bold text-foreground sm:text-xl lg:text-2xl">{item.value}</span>
                    <span className="text-xs text-muted-foreground">{item.suffix}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <div className="flex flex-col rounded-xl bg-card p-4 shadow-card lg:col-span-3 sm:p-5" style={{ minHeight: '280px' }}>
            <h3 className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-foreground lg:mb-5 lg:text-base">
              <BarChart3 className="h-3.5 w-3.5 text-primary sm:h-4 sm:w-4" />
              成绩分布
            </h3>
            <div className="flex-1 flex items-end gap-2 sm:gap-4">
              {distribution.map((bar) => {
                const heightPct = maxCount > 0 ? (bar.count / maxCount) * 100 : 0;
                return (
                  <div key={bar.range} className="flex flex-1 flex-col items-center gap-2">
                    <div className="text-xs font-semibold text-foreground">{bar.count}人</div>
                    <div className="flex h-20 w-full items-end overflow-hidden rounded-t-md bg-muted sm:h-120">
                      <div className={cn('w-full rounded-t-md transition-all', bar.color)} style={{ height: `${heightPct}%` }} />
                    </div>
                    <div className={cn('text-xs font-medium', bar.text)}>{bar.range}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl bg-card p-4 shadow-card lg:col-span-2 sm:p-5">
            <h3 className="mb-4 flex items-center justify-between text-sm font-semibold text-foreground lg:mb-5 lg:text-base">
              <span className="flex items-center gap-1.5">
                <Code className="h-3.5 w-3.5 text-accent-pink sm:h-4 sm:w-4" />
                易错知识点 TOP 5
              </span>
              <button
                onClick={() => handleExportKp()}
                className="text-xs text-primary hover:underline sm:text-sm"
              >
                导出全部
              </button>
            </h3>
            <div className="space-y-3 sm:space-y-4">
              {topKp.map((kp, idx) => (
                <div key={idx} className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-start gap-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary sm:h-5 sm:w-5">{idx + 1}</span>
                    <span className="whitespace-pre-wrap break-all text-xs font-medium text-foreground sm:text-sm leading-relaxed">{kp.name}</span>
                  </div>
                  <div className="flex items-center gap-3 pt-0.5">
                    <span className="text-xs font-semibold text-muted-foreground">{kp.count} 次</span>
                    <button onClick={() => handleExportSingleKp(kp)} className="text-xs text-primary hover:underline">导出</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-card p-4 shadow-card sm:p-5">
          <h3 className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-foreground lg:mb-5 lg:text-base">
            <TrendingUp className="h-3.5 w-3.5 text-accent-green sm:h-4 sm:w-4" />
            四维度平均得分
          </h3>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {DIMENSIONS.map((dim) => (
              <RingProgress key={dim.name} percent={(dim.score / dim.full) * 100} color={dim.ring} label={dim.name} value={`${dim.score} / ${dim.full}`} />
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-card p-5 shadow-card">
          <h3 className="mb-5 flex items-center justify-between text-base font-semibold text-foreground">
            <span className="flex items-center gap-1.5">
              <Code className="h-4 w-4 text-primary" />
              最近评价记录
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleExport('all')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent-green px-3 py-1.5 text-xs font-semibold text-white shadow-float transition-all hover:opacity-90 sm:px-4 sm:py-2 sm:text-sm"
              >
                <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                导出全部
              </button>
              <button
                onClick={() => handleExport('class')}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-all hover:bg-muted sm:px-4 sm:py-2 sm:text-sm"
              >
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                按班级导出
              </button>
              <button
                onClick={() => handleExport('student')}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-all hover:bg-muted sm:px-4 sm:py-2 sm:text-sm"
              >
                <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                按学生导出
              </button>
            </div>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="py-2.5 pr-4">学生姓名</th>
                  <th className="py-2.5 pr-4">班级</th>
                  <th className="py-2.5 pr-4">题目</th>
                  <th className="py-2.5 pr-4">总分</th>
                  <th className="py-2.5 pr-4">等级</th>
                  <th className="py-2.5">评价时间</th>
                </tr>
              </thead>
              <tbody>
                {recentRecords.length > 0 ? (
                  recentRecords.map((rec) => (
                    <tr key={rec.id} className="border-b border-border/50 last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="py-3 pr-4 text-foreground">{rec.name}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{rec.class}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{rec.title}</td>
                      <td className="py-3 pr-4 font-bold text-foreground">{rec.score}</td>
                      <td className="py-3 pr-4">
                        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold', levelBadgeClass(rec.level))}>
                          {rec.level}
                        </span>
                      </td>
                      <td className="py-3 text-muted-foreground">{rec.time}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">暂无评价记录</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-center gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="inline-flex items-center justify-center rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50 disabled:pointer-events-none"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = totalPages <= 5 ? i + 1 : 
                currentPage <= 3 ? i + 1 : 
                currentPage >= totalPages - 2 ? totalPages - 4 + i : 
                currentPage - 2 + i;
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={cn(
                    "min-w-8 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    currentPage === pageNum
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-background text-foreground hover:bg-muted"
                  )}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="inline-flex items-center justify-center rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50 disabled:pointer-events-none"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-2 text-center text-xs text-muted-foreground">
            第 {currentPage} / {totalPages} 页，共 {filteredEvaluations.length} 条记录
          </div>
        </div>

        <div className="rounded-xl bg-card p-5 shadow-card">
          <h3 className="mb-5 flex items-center gap-1.5 text-base font-semibold text-foreground">
            <Quote className="h-4 w-4 text-amber-700" />
            知识点词云
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 py-6">
            {WORDCLOUD.map((w) => (
              <span key={w.text} className={cn('cursor-default transition-transform hover:-translate-y-0.5', w.size, w.weight, w.color)}>
                {w.text}
              </span>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-center gap-3 border-t border-border/50 pt-4 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            <span>字号代表知识点重要程度</span>
          </div>
        </div>
      </div>

      {generatingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="rounded-2xl bg-white p-8 shadow-2xl max-w-md w-full mx-4">
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent-purple/20">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent-purple">
                  <FileText className="h-7 w-7 text-white animate-pulse" />
                </div>
              </div>

              <h2 className="mb-2 text-xl font-bold text-foreground">
                AI正在生成学情诊断报告
              </h2>
              <p className="mb-6 text-sm text-muted-foreground">
                正在分析学习数据并生成个性化报告，请稍候...
              </p>

              <div className="w-full">
                <div className="mb-2 flex justify-between text-xs font-medium text-muted-foreground">
                  <span>处理进度</span>
                  <span>{reportProgress}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent-purple transition-all duration-500 ease-out"
                    style={{ width: `${reportProgress}%` }}
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                <span>{reportProgress < 30 ? '📊 正在分析学习数据' : reportProgress < 60 ? '📈 正在生成统计图表' : reportProgress < 90 ? '🤖 AI正在撰写分析建议' : '📄 正在导出报告文件'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}