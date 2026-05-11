# 数据库连接配置指南

## 问题说明

运行 `npm run tag-books` 时出现 `ECONNREFUSED` 错误,表示无法连接到数据库。

## 解决方案

### 方案一: 使用远程数据库(推荐)

项目使用Neon PostgreSQL数据库,需要在 `.env` 文件中配置正确的数据库连接字符串:

```env
DATABASE_URL=postgresql://username:password@hostname/database_name
```

**获取数据库连接字符串:**

1. 登录 [Neon Console](https://console.neon.tech/)
2. 选择你的项目
3. 复制 Connection String
4. 粘贴到 `.env` 文件的 `DATABASE_URL` 中

### 方案二: 本地数据库(开发环境)

如果想在本地运行PostgreSQL:

#### 1. 安装PostgreSQL

```bash
# Windows (使用Chocolatey)
choco install postgresql

# macOS (使用Homebrew)
brew install postgresql

# 或使用Docker
docker run --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres
```

#### 2. 创建数据库

```bash
# 连接到PostgreSQL
psql -U postgres

# 创建数据库
CREATE DATABASE flipbook_downloader;

# 退出
\q
```

#### 3. 配置.env

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/flipbook_downloader
```

#### 4. 运行数据库迁移

```bash
npm run db:push
```

### 方案三: 仅在生产环境运行

如果本地没有数据库,可以直接部署到Vercel,让Cron任务在生产环境执行:

1. 确保Vercel环境变量中已配置 `DATABASE_URL`
2. 部署代码到Vercel
3. Cron会自动在每天凌晨1点执行

## 验证数据库连接

运行以下命令测试连接:

```bash
# 测试数据库连接
npm run db:push
```

如果连接成功,会显示:

```
[✓] Pulling schema from database...
[✓] Changes applied
```

## 环境变量清单

确保 `.env` 文件中包含以下变量:

```env
# 必需
DATABASE_URL=postgresql://...

# 可选(用于Cron API认证)
CRON_SECRET=your_secret_key

# 可选(用于日志和sitemap)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## 常见问题

### Q: 从哪里获取DATABASE_URL?

A: 从你的PostgreSQL服务提供商处获取,如Neon、Supabase、Vercel Postgres等。

### Q: 本地开发和生产环境可以使用同一个数据库吗?

A: 可以,但建议使用不同的数据库实例,避免数据混淆。

### Q: 如何在Vercel中配置环境变量?

A:

1. 登录Vercel Dashboard
2. 进入项目设置
3. 点击 "Environment Variables"
4. 添加 `DATABASE_URL` 变量
5. 选择适用的环境(Production/Preview/Development)

## 下一步

配置好数据库后,重新运行:

```bash
# Dry Run模式
npm run tag-books:dry-run

# 完整分析
npm run tag-books
```
