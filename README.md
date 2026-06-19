# 码上成长 — Python AI 智能学习平台

> 面向中职学生的 Python 编程学习平台，结合 AI 智能评价与个性化学习建议，让编程学习更高效、更有趣。

![Next.js](https://img.shields.io/badge/Next.js-16.1-000000?style=flat-square&logo=nextdotjs)
![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)
![Author](https://img.shields.io/badge/Author-MYJ-blue?style=flat-square)

---

## 一、项目简介

**码上成长** 是一套面向职业教育（中职）阶段的 Python 智能学习平台。学生可以在平台上进行编程练习，AI 会自动对学生提交的代码进行全方位评价分析，包括语法正确性、知识点掌握情况、代码风格等，并给出个性化学习建议。

管理员（教师）可以管理学生信息、维护题库、查看学情统计、管理学习资源链接，实现教学过程的数字化管理。

### 核心价值

- **AI 智能代码评价**：不再依赖人工批改，学生提交代码即可获得即时反馈
- **个性化学习建议**：AI 根据学生代码自动识别薄弱环节，给出针对性学习建议
- **学情数据分析**：教师端提供完整的学情统计、知识点分布、成绩导出等功能
- **在线代码运行**：内置 Python 代码执行环境，支持交互式输入/输出
- **AI 对话解惑**：学生可以随时与 AI 对话，获得编程问题的启发式引导
- **学习资源集成**：平台内置精选的 Python 学习资源链接（视频、文档、教程等）

---

## 二、功能模块

### 2.1 学生端功能

| 模块 | 说明 |
|------|------|
| **试题演练** | 浏览和练习平台内置的 Python 编程题目，查看题目提示和参考答案 |
| **代码评价** | 学生编写代码后提交，AI 自动生成多维度评价（语法正确性、知识点匹配、代码风格、综合评分、学习建议） |
| **学情统计** | 查看个人的历史评价记录、成绩趋势、知识点掌握情况、AI 个性化分析报告 |
| **AI 解惑** | 与 AI 智能助手进行对话式交流，支持多会话管理、消息持久化、提示词模板 |
| **学习资源** | 浏览管理员设置的外部学习资源链接，在平台内嵌 iframe 中直接访问 |

### 2.2 管理员端功能

| 模块 | 说明 |
|------|------|
| **学生管理** | 学生信息的增删改查、批量导入、密码管理 |
| **题库管理** | Python 练习题目的维护，包含题目标题、内容、提示、示例代码 |
| **学情记录** | 查看所有学生的代码评价历史记录，支持按学生、知识点、分数筛选 |
| **学情分析** | 班级维度的统计图表（平均分、等级分布、知识点频次），支持导出 Excel |
| **学习资源** | 管理平台推荐的外部学习资源链接，支持排序和描述 |

---

## 三、技术架构

### 3.1 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| **前端框架** | Next.js (App Router) | 16.1.x |
| **核心库** | React | 19.2.x |
| **类型系统** | TypeScript | 5.x |
| **UI 组件** | shadcn/ui (基于 Radix UI) | latest |
| **样式方案** | Tailwind CSS | 4.x |
| **状态管理** | React Hooks (useState / useEffect) | — |
| **数据库** | SQLite (better-sqlite3) | 12.x |
| **AI 服务** | OpenAI API (兼容 ChatGLM 等) | — |
| **图表库** | Recharts | 2.15.x |
| **富文本** | react-markdown + rehype-highlight | — |
| **Excel 导出** | SheetJS (xlsx) | 0.18.x |
| **图标库** | Lucide React | 0.468.x |

### 3.2 目录结构

```
src/
├── app/                       # Next.js App Router 页面
│   ├── page.tsx              # 首页（登录后跳转）
│   ├── login/                # 登录页（学生/管理员）
│   ├── evaluate/             # 学生端：代码评价页
│   ├── practice/             # 学生端：试题演练页
│   ├── statistics/           # 学生端：学情统计页
│   ├── chat/                 # 学生端：AI 解惑对话页
│   ├── resources/            # 学生端：学习资源页
│   ├── admin/                # 管理员端首页
│   │   ├── statistics/       # 管理员端：学情分析
│   │   └── resources/        # 管理员端：学习资源管理
│   └── api/                  # API 路由
│       ├── auth/login        # 用户登录接口
│       ├── auth/session      # session 验证/注销
│       ├── chat              # AI 对话接口
│       ├── evaluate          # 代码评价接口（核心）
│       ├── run-code          # 代码在线运行接口
│       ├── evaluations       # 学情记录 CRUD
│       ├── questions         # 题库 CRUD
│       ├── students          # 学生管理 CRUD
│       ├── resources         # 学习资源 CRUD
│       ├── statistics        # 学情统计/搜索/导出
│       └── generate-report   # 生成学情分析报告
├── components/               # 通用组件
│   ├── ui/                   # shadcn/ui 组件库
│   ├── header.tsx            # 顶部导航
│   ├── footer.tsx            # 页脚
│   └── protected-layout.tsx  # 受保护页面布局（登录校验）
├── lib/                      # 工具库与核心模块
│   ├── db.ts                 # 数据库模块（SQLite 操作核心）
│   ├── auth.ts               # 认证与前端数据操作封装
│   └── utils.ts              # 通用工具函数（cn 类名合并等）
└── server.ts                 # 自定义服务端入口（支持 HOSTNAME 配置）

scripts/                       # 构建与启动脚本
├── build.sh                  # 生产环境构建
├── dev.sh                    # 开发环境启动
├── prepare.sh                # 预处理脚本
└── start.sh                  # 生产环境启动

data/                         # SQLite 数据库文件（运行时自动创建）
public/                       # 静态资源
```

### 3.3 数据流

```
┌─────────────┐     HTTP/JSON      ┌────────────────┐      SQL      ┌──────────┐
│  浏览器前端  │ ──────────────────▶ │  Next.js API   │ ────────────▶ │  SQLite  │
│  (React UI)  │ ◀────────────────── │   路由处理     │ ◀──────────── │  数据库  │
└─────────────┘      JSON 响应      └────────────────┘     结果     └──────────┘
        │                                 │
        │                                 │ 调用 AI 服务
        ▼                                 ▼
   用户界面渲染                    ┌──────────────────┐
                                │  OpenAI / ChatGLM │
                                │   AI 大模型 API    │
                                └──────────────────┘
```

---

## 四、核心功能实现

### 4.1 AI 代码评价（核心功能）

**文件**：`src/app/api/evaluate/route.ts`

- 使用预设的 **Python 知识点模板**（40+ 项常见知识点和易错点）
- 通过 OpenAI API 对学生代码进行结构化分析
- 返回内容包含：代码正确性检查、语法错误提示、使用到的知识点、代码风格评价、综合评分（百分制）、个性化学习建议
- 评价结果自动持久化到数据库，支持历史回溯

### 4.2 在线代码运行

**文件**：`src/app/api/run-code/route.ts`

- **自动 Python 路径检测**：兼容 `python3`、`python` 及不同 Linux/Windows 服务器环境
- **执行超时保护**：限制单次执行最长 10 秒，防止死循环
- **交互式输入支持**：通过 stdin 传递用户输入供 `input()` 函数使用
- **多编码输出处理**：支持 UTF-8、GBK、GB2312 等中文编码解码
- **安全执行**：使用 `spawnSync` 而非 shell 模式，降低注入风险

### 4.3 AI 对话解惑

**文件**：`src/app/api/chat/route.ts`、`src/app/chat/page.tsx`

- **系统级安全规则**：AI 助手严格限制只回答 Python 相关问题
- **启发式教学**：不直接给出完整代码答案，采用引导式提问和提示
- **多会话管理**：学生可以创建多个对话主题，支持重命名和删除
- **消息持久化**：所有对话消息保存在数据库中，刷新页面不丢失
- **移动端适配**：底部浮动按钮打开侧边栏，支持响应式布局

### 4.4 学情分析报告

**文件**：`src/app/api/generate-report/route.ts`、`src/app/statistics/page.tsx`

- 基于学生的历史评价记录，调用 AI 生成个性化分析报告
- 报告包含：学习总结、优势亮点、薄弱环节、改进建议、后续学习规划
- 支持 Markdown → HTML 转换，界面美观易读
- 管理员端支持按班级维度的整体统计和 Excel 导出

### 4.5 登录与权限系统

**文件**：`src/app/api/auth/login/route.ts`、`src/lib/auth.ts`

- 双角色系统：学生（student） / 管理员（admin）
- Session 机制：登录后生成唯一 sessionId，保存在浏览器 localStorage
- 前端路由守卫：`protected-layout.tsx` 校验登录状态，未登录自动跳转登录页
- Session 过期清理：数据库自动清理 7 天前的 session

---

## 五、快速开始

### 5.1 环境要求

| 工具 | 要求 |
|------|------|
| **Node.js** | >= 18.17（推荐 20+） |
| **pnpm** | >= 9.0（**必须使用 pnpm，严禁 npm/yarn**） |
| **Python** | python3 或 python（用于在线代码运行功能） |
| **操作系统** | Windows / macOS / Linux |

### 5.2 安装与启动

```bash
# 1. 克隆项目
git clone https://github.com/moyongj/pythonai.git
cd pythonai

# 2. 安装依赖（必须使用 pnpm）
pnpm install

# 3. 配置环境变量（复制 .env.example 为 .env，或直接配置）
# 主要配置项：
#   - OPENAI_API_KEY：AI 服务 API Key（支持 OpenAI / ChatGLM 兼容接口）
#   - OPENAI_BASE_URL：自定义 API 基础地址（可选）
#   - HOSTNAME：服务监听地址（默认 0.0.0.0）
#   - PORT：服务监听端口（默认 3000）

# 4. 开发模式启动
pnpm run dev

# 5. 生产环境构建
pnpm run build

# 6. 生产环境启动
pnpm run start
```

### 5.3 初始账号

项目首次启动时，数据库会自动初始化并插入默认数据：

| 角色 | 用户名 | 密码 |
|------|--------|------|
| **管理员** | myj | 123456 |
| **学生** | 01 / 02 / 03 ... | 123456 |

---

## 六、配置说明

### 6.1 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `OPENAI_API_KEY` | AI 服务 API 密钥 | — |
| `OPENAI_BASE_URL` | AI 服务基础地址 | `https://api.openai.com/v1` |
| `OPENAI_MODEL` | 使用的模型名称 | `gpt-4o-mini` |
| `HOSTNAME` | 服务监听地址 | `0.0.0.0` |
| `PORT` | 服务监听端口 | `3000` |

### 6.2 数据库说明

- 使用 **SQLite** 作为数据库，文件保存在 `data/mscz.db`
- 首次启动自动完成表结构创建和初始数据填充（管理员账号、默认学生、默认题库、默认学习资源）
- 数据库文件已在 `.gitignore` 中忽略，不会被提交到 Git 仓库

---

## 七、API 接口一览

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/auth/login` | POST | 用户登录（学生/管理员共用） |
| `/api/auth/session` | POST / DELETE | Session 验证 / 用户注销 |
| `/api/evaluate` | POST | 提交代码进行 AI 评价 |
| `/api/run-code` | POST | 在线运行 Python 代码 |
| `/api/evaluations` | GET / POST / DELETE | 学情评价记录 CRUD |
| `/api/questions` | GET / POST / PUT / DELETE | 题库 CRUD |
| `/api/students` | GET / POST / PUT / DELETE | 学生信息 CRUD |
| `/api/resources` | GET / POST / PUT / DELETE | 学习资源 CRUD |
| `/api/chat` | POST / GET / DELETE | AI 对话接口（创建会话、发送消息、删除会话） |
| `/api/statistics` | GET / POST | 学情统计摘要、按条件搜索记录 |
| `/api/generate-report` | POST | 生成学情分析报告 |

---

## 八、开发与部署

### 8.1 本地开发

```bash
pnpm run dev
```

默认访问地址：http://localhost:3000

### 8.2 生产构建

```bash
pnpm run build
pnpm run start
```

### 8.3 服务器部署（宝塔面板推荐）

1. 将项目文件上传到服务器（或通过 Git 克隆）
2. 在项目根目录执行 `pnpm install` 和 `pnpm run build`
3. 通过宝塔 "网站" → "Node 项目" 添加项目
4. 启动命令填写：`pnpm run start`
5. 启动目录填写项目根目录
6. 配置反向代理指向 `http://127.0.0.1:3000`
7. **确保服务器安装了 Python**（用于在线代码运行功能）

### 8.4 代码检查

```bash
# TypeScript 类型检查
pnpm run ts-check

# ESLint 代码检查
pnpm run lint:build
```

---

## 九、开源协议

本项目采用 **MIT License** 开源协议。

### 允许的使用

- ✅ 商业使用
- ✅ 修改源代码
- ✅ 分发传播
- ✅ 私人使用

### 限制

- ❌ 作者不对软件的任何问题承担责任
- ❌ 不得使用作者名义进行宣传

### 要求

- ⚠️ 分发时必须保留版权声明和许可声明

完整协议内容请见 [LICENSE](./LICENSE) 文件。

---

## 十、版权与致谢

### 作者信息

- **作者**：MYJ
- **项目仓库**：https://github.com/moyongj/pythonai

### 项目声明

© 2026-2036 MYJ. 保留所有权利。

本项目作为 Python 编程教学辅助工具而开发，欢迎对职业教育感兴趣的同仁交流讨论。

### 依赖致谢

感谢以下优秀的开源项目为本项目提供了坚实的基础：

- [Next.js](https://nextjs.org/) — React 全栈框架
- [React](https://react.dev/) — 前端 UI 库
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) — 高性能 SQLite 驱动
- [shadcn/ui](https://ui.shadcn.com/) — 组件库方案
- [Tailwind CSS](https://tailwindcss.com/) — CSS 框架
- [OpenAI API](https://platform.openai.com/) — AI 大模型服务
- [Lucide](https://lucide.dev/) — 图标库
- [Recharts](https://recharts.org/) — 图表库
- [SheetJS](https://sheetjs.com/) — Excel 处理

---

## 十一、联系与反馈

如有项目相关的问题、建议或合作意向，欢迎通过以下方式联系：

- GitHub Issues：https://github.com/moyongj/pythonai/issues
- 项目主页：https://github.com/moyongj/pythonai

---

<p align="center">
  <strong>让编程学习，成长可见 ✨</strong>
</p>
