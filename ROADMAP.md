# EduSync 开发路线图（新手版）
> 由 Claude 基于代码审查生成 · 2026-03-31

---

## 一、项目现状总结

### ✅ 前端（已完成的部分）
- **框架搭建完毕**：React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **8个页面模板已存在**：Dashboard、Calendar、Classes、Students、Assignments、Tuition、Notifications、Settings
- **UI组件齐全**：shadcn/ui 的全套组件已安装
- **Mock 数据完整**：`src/lib/mock-data.ts` 已有完整的假数据（用户、班级、课程、作业、账单等）

### ❌ 前端（缺失的关键部分）
- **没有登录/注册页面** → 必须先做！
- **没有认证状态管理** → 不知道当前用户是谁、什么角色
- **所有数据都是假数据** → 还没有连接后端 API
- **没有角色权限控制** → Admin/Teacher/Student 看到的应该是不同界面

### ✅ 后端（已完成的部分）
- Flask 环境和 venv 已建好
- `run.py` 和 `app/__init__.py` 骨架存在
- 可以启动 Flask，有 `/` 和 `/test` 两个测试路由

### ❌ 后端（缺失的全部内容）
- 没有 config.py、extensions.py
- 没有任何 Blueprint（auth、users、classes 等）
- 没有连接 Supabase
- 没有数据库表
- 没有 JWT 认证
- 没有任何业务逻辑 API

---

## 二、原计划问题（需修正）

README 里的 Sprint 计划总体很好，但有一个**依赖顺序 Bug** 需要注意：

| 问题 | 原计划 | 正确做法 |
|---|---|---|
| BE-11（课程笔记）和 BE-12（改课申请）依赖 BE-18（余额系统），但 BE-18 在 Sprint 5 | Sprint 3 里有任务依赖 Sprint 5 的内容 | 先建立通知工具函数（内部 helper），不必等完整的通知系统 |
| 前端没有登录页 | 计划里没有专门提到 | 需要在开始连接后端前，先做前端的 Auth 页面 |

---

## 三、完整开发路线（带你一步步来）

### 🔵 阶段 0：搞清楚基础（你现在所在的位置）
**目标**：能跑起来前端，理解项目结构
- [x] `npm run dev` 能跑起前端 → http://localhost:8080
- [x] 能看懂 `src/App.tsx`（路由配置）
- [x] 能看懂 `src/lib/mock-data.ts`（了解数据结构）
- [ ] `cd backend && python run.py` 能跑起 Flask → http://localhost:5000

---

### 🟡 阶段 1：后端基础架构（BE-01 系列）⭐ 从这里开始！

**你要学的概念**：Flask Blueprint、环境变量、Supabase

#### 第1步：完善 Flask 项目结构（BE-01-A）
```
backend/
├── app/
│   ├── __init__.py      ← 已有，需要补充
│   ├── config.py        ← 新建：读取环境变量
│   ├── extensions.py    ← 新建：Supabase 客户端
│   └── blueprints/
│       └── auth.py      ← 新建（先做这一个）
├── .env                 ← 新建：你的密钥（不上传 GitHub！）
├── .env.example         ← 新建：示例文件
├── requirements.txt     ← 新建
└── run.py               ← 已有
```

#### 第2步：注册 Supabase（BE-01-B）
1. 去 supabase.com 注册，创建一个项目
2. 在 Project Settings → API 里拿到 URL 和 service_role key
3. 填写 `.env` 文件

#### 第3步：在 Supabase 里建数据库表（BE-01-C 到 BE-01-H）
- 顺序：`companies` → `users` → `class_groups` → `class_enrollments` → `sessions` → `assignments` → `transactions` → `notifications`
- 每建一张表，在 Supabase SQL 编辑器里运行 README 里的 SQL 语句

**完成标志**：`GET /api/health` 返回 `{ "status": "ok" }`

---

### 🟡 阶段 2：用户认证（BE-02 到 BE-06）

**你要学的概念**：密码哈希（bcrypt）、JWT Token、HTTP 请求/响应

#### 第4步：Admin 注册（BE-02）
- `POST /api/auth/register/admin`
- 测试工具：用 **Postman** 或 **Thunder Client（VS Code 插件）** 发请求测试

#### 第5步：Student 注册（BE-04）
- `POST /api/auth/register/student`（比 Teacher 简单，先做这个）

#### 第6步：登录（BE-05）
- `POST /api/auth/login` → 返回 JWT token

#### 第7步：JWT 中间件（BE-06）
- 写 `@require_auth` 装饰器
- 写 `@require_role(...)` 装饰器

**完成标志**：用 Postman 能注册 + 登录，拿到 JWT token

---

### 🟠 阶段 3：前端接入认证 ⭐ 重要转折点

**你要学的概念**：React Context、localStorage、axios/fetch

#### 第8步：给前端加登录页面
- 新建 `src/pages/LoginPage.tsx`
- 新建 `src/pages/RegisterPage.tsx`
- 新建 `src/context/AuthContext.tsx`（保存当前用户信息）

#### 第9步：前端调用真实 API
- 新建 `src/lib/api.ts`（封装 fetch，自动带上 JWT token）
- 把登录页连接到 `POST /api/auth/login`
- 登录成功后根据 role 跳转不同页面

#### 第10步：路由保护
- 未登录用户自动跳转到登录页
- 不同角色看到不同的侧边栏菜单

**完成标志**：能在浏览器里真实注册账号、登录、跳转到 Dashboard

---

### 🟠 阶段 4：班级管理（BE-07 到 BE-09）

**你要学的概念**：CRUD API、React Query（数据获取）

#### 第11步：后端班级 API
- `GET/POST/PATCH/DELETE /api/classes`（BE-08）
- `POST /api/classes/:id/invite`（BE-09）

#### 第12步：前端 ClassesPage 接真实数据
- 把 `mockClasses` 替换成 `useQuery(() => fetch('/api/classes'))`
- 添加"创建班级"表单，调用 `POST /api/classes`

**完成标志**：能在界面里真实创建班级，刷新后还在

---

### 🟠 阶段 5：日历与课程（BE-10 到 BE-12）

#### 第13步：后端课程 API（BE-10）
- 创建/获取/修改/删除课程
- 支持循环课程自动生成

#### 第14步：前端 CalendarPage 接真实数据
- 把 `mockSessions` 替换成真实 API

#### 第15步：改课申请流程（BE-12）
- 学生提交改课 → 老师审批

---

### 🟠 阶段 6：作业系统（BE-13 到 BE-15）

#### 第16步：作业 CRUD（BE-13）
#### 第17步：文件上传提交（BE-14）
- 前端上传文件 → 存到 Supabase Storage
#### 第18步：评分反馈（BE-15）

---

### 🔴 阶段 7：学费管理（BE-17 到 BE-20）

#### 第19步：余额与充值（BE-18）
- 手动充值记录
- 课程结束后自动扣费（cron job）

#### 第20步：低余额提醒（BE-19）
#### 第21步：PDF 报告生成（BE-20）

---

### 🔴 阶段 8：通知系统（BE-21）

#### 第22步：通知 API
- 创建/获取/已读通知

#### 第23步：前端 NotificationsPage 接真实数据

---

### 🟣 阶段 9：部署（OPS 系列）

#### 第24步：前端部署到 Vercel（OPS-08）
- 连接 GitHub → 自动部署

#### 第25步：后端部署到 VPS（OPS-03 到 OPS-06）
- 配置 Nginx + Gunicorn + systemd

#### 第26步：Cloudflare Tunnel（OPS-01 到 OPS-02）
#### 第27步：GitHub Actions CI/CD（OPS-07）

---

## 四、技术栈学习顺序（新手路线）

```
Week 1-2: Python Flask 基础 + HTTP 概念（GET/POST/状态码）
Week 3-4: Supabase 使用（数据库 + Auth + Storage）
Week 5-6: JWT 认证原理 + 前后端联调
Week 7-8: React Query + 前端 API 集成
Week 9+: 功能迭代 + 部署
```

---

## 五、立即可以开始的第一步

```bash
# 1. 先确认前端能跑
npm run dev

# 2. 安装后端依赖
cd backend
pip install flask flask-cors python-dotenv supabase pyjwt bcrypt gunicorn

# 3. 创建 requirements.txt
pip freeze > requirements.txt

# 4. 测试后端能跑
python run.py
# 访问 http://localhost:5000 看到 "HOME OK" 就对了
```

接下来：去 supabase.com 注册账号，创建你的第一个项目！

---

## 六、工具推荐

| 工具 | 用途 |
|---|---|
| **VS Code** | 代码编辑器 |
| **Thunder Client**（VS Code 插件） | 测试后端 API（像 Postman） |
| **Supabase 控制台** | 查看数据库、管理数据 |
| **React DevTools**（Chrome 插件） | 调试前端 |
| **Git** | 版本控制（每完成一个功能就 commit） |

---

*路线图版本 v1.0 · 如有问题随时问我！*
