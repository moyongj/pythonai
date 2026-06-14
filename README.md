# 码上成长 | Python代码智能评价与学情诊断AI智能体

这是一个面向中职学生的 Python 代码智能评价与学情诊断系统，基于 [Next.js 16](https://nextjs.org) + [shadcn/ui](https://ui.shadcn.com) 开发，使用 SQLite 数据库存储数据。

**制作者**：MYJ  
**代码辅助**：DeepSeek  
**智能体AI**：DeepSeek

## 功能特点

### 核心功能

- **代码评价**：从题目理解、逻辑思路、代码可读性、语法掌握四个维度静态分析 Python 代码
- **试题演练**：提供 100 道中职阶段 Python 练习题，支持代码执行和答案查看
- **学情诊断**：生成个性化评价报告与易错知识点分析
- **数据分析**：可视化展示学习进度、成绩分布、能力雷达图

### 角色权限

- **管理员**：学生管理、题库管理、学情记录管理、学情统计分析
- **学生**：代码评价、试题练习、个人学情查看

## 快速开始

### 环境要求

- Node.js 18+
- pnpm 9+

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm run dev
```

启动后，在浏览器中打开 [http://localhost:5000](http://localhost:5000) 查看应用。

### 构建生产版本

```bash
pnpm run build
```

### 启动生产服务器

```bash
pnpm run start
```

## 登录账号

### 管理员账号

- **用户名**：myj
- **密码**：123456

### 学生账号（示例）

- **学号**：01-47
- **密码**：123456

> 学生账号由管理员导入，默认密码为 123456

## 项目结构

```
src/
├── app/                      # Next.js App Router 目录
│   ├── page.tsx             # 首页（代码评价）
│   ├── login/               # 登录页面
│   ├── practice/            # 试题演练页面
│   ├── statistics/          # 学生学情统计页面
│   ├── admin/               # 管理员后台
│   │   ├── page.tsx         # 学生管理、题库管理、学情记录
│   │   └── statistics/      # 管理员学情分析
│   └── api/                 # API 路由
│       ├── auth/            # 认证接口
│       ├── students/        # 学生管理接口
│       ├── questions/       # 题库管理接口
│       ├── evaluations/     # 学情记录接口
│       ├── execute/         # 代码执行接口
│       └── run-code/        # Python 代码运行接口
├── components/              # React 组件目录
│   ├── ui/                  # shadcn/ui 基础组件
│   ├── header.tsx          # 页面头部导航
│   └── footer.tsx          # 页面底部
└── lib/                     # 工具函数库
    ├── utils.ts            # cn() 等工具函数
    ├── db.ts               # SQLite 数据库操作
    └── auth.ts             # 认证与数据操作函数

server/
├── index.ts                 # 自定义服务器入口
└── tsconfig.json           # Server TypeScript 配置

data/
└── mscz.db                 # SQLite 数据库文件
```

## 技术栈

- **前端框架**: Next.js 16 (App Router)
- **UI 组件**: React 19 + shadcn/ui (基于 Radix UI)
- **样式**: Tailwind CSS 4
- **数据库**: SQLite (better-sqlite3)
- **表格处理**: xlsx (Excel 导入导出)
- **图表**: recharts
- **图标**: Lucide React
- **包管理器**: pnpm 9+
- **语言**: TypeScript 5

## 开发规范

### 1. 组件开发

**优先使用 shadcn/ui 基础组件**

本项目已预装完整的 shadcn/ui 组件库，位于 `src/components/ui/` 目录。开发时应优先使用这些组件作为基础。

### 2. 路由开发

Next.js 使用文件系统路由，在 `src/app/` 目录下创建文件夹即可添加路由：

```bash
# 创建新路由 /about
src/app/about/page.tsx

# 创建 API 路由
src/app/api/users/route.ts
```

### 3. 依赖管理

**必须使用 pnpm 管理依赖**

```bash
# 安装依赖
pnpm install

# 添加新依赖
pnpm add package-name

# 添加开发依赖
pnpm add -D package-name
```

### 4. 数据库操作

数据库使用 SQLite，通过 `src/lib/db.ts` 中的函数进行操作：

- `initDatabase()`: 初始化数据库表
- `addEvaluation()`: 添加评价记录
- `getEvaluations()`: 获取评价记录
- `getStudents()`: 获取学生列表

### 5. 认证与权限

通过 `src/lib/auth.ts` 中的函数管理用户认证：

- `login()`: 用户登录
- `validateSession()`: 验证登录状态
- `logout()`: 退出登录

## 主要页面说明

### 首页 (/page.tsx)

代码评价主页面，用户输入 Python 代码后可获得四维度评价报告。

### 试题演练 (/practice)

左侧显示题目列表（每页 10 道），右侧为代码编辑执行区，输入密码 `mlszs` 可查看答案。

### 学生学情 (/statistics)

展示个人的学习数据，包括评价次数、平均分、成绩分布、能力雷达图等。

### 管理员后台 (/admin)

- **学生管理**：查看、添加、编辑、删除学生，支持 Excel 导入
- **题库管理**：查看、添加、编辑、删除题目
- **学情记录**：查看、删除评价记录

### 管理员学情分析 (/admin/statistics)

汇总统计页面，展示班级整体学习情况，包括：
- 总评价次数、平均分、优秀率
- 易错知识点分析
- 成绩分布图表
- 四维度能力得分
- 最近评价记录（支持分页、筛选、导出）

## 常见问题

### 数据库文件位置

数据库文件位于 `data/mscz.db`，首次启动会自动创建。

### 初始数据

- **管理员账号**：myj / 123456
- **学生账号**：由管理员导入，默认密码 123456
- **题目数据**：预置 100 道中职阶段 Python 练习题

### 代码执行

Python 代码在服务器端执行，支持基本输入输出，不支持需要交互式终端的操作。

## 参考文档

- [Next.js 官方文档](https://nextjs.org/docs)
- [shadcn/ui 组件文档](https://ui.shadcn.com)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [better-sqlite3 文档](https://github.com/WiseLibs/better-sqlite3)
