# Cloudflare Pages 部署指南

## 问题修复总结

在部署到Cloudflare Pages时，我们修复了以下问题：

### 1. ✅ 创建 wrangler.toml 配置文件

- 添加了Cloudflare Workers配置
- 设置了Node.js兼容性标志
- 配置了构建命令

### 2. ✅ 修复 SEO 提交 500 错误

- 在 `scripts/generate-blog-list.ts` 中添加了错误处理
- SEO提交失败不再阻止构建过程
- 添加了友好的警告信息

### 3. ✅ 处理 IndexedDB 兼容性

- 代码中已有完善的检测机制
- 构建时的警告是正常的（Node.js环境不支持IndexedDB）
- 运行时在浏览器中会正常工作

### 4. ✅ 修复数据库连接

- 使用 `postgres` 库连接Supabase PostgreSQL
- 使用 `drizzle-orm/postgres-js` 适配器
- 配置 `{ prepare: false }` 以兼容Cloudflare Workers环境

## 部署步骤

### 1. 在Cloudflare Dashboard中配置环境变量

你需要在Cloudflare Pages设置中添加以下环境变量：

```
DATABASE_URL=your_neon_database_url
CRON_SECRET=your_cron_secret
NEXT_PUBLIC_BASE_URL=https://your-domain.com
DISCORD_WEBHOOK_URL=your_discord_webhook_url (可选)
SEO_SUBMIT_URL=your_seo_submit_url (可选)
```

### 2. 设置构建配置

在Cloudflare Pages项目中：

- **Framework preset**: Next.js
- **Build command**: `npx @cloudflare/next-on-pages@1`
- **Build output directory**: `.vercel/output/static`
- **Root directory**: `/` (根目录)

### 3. 环境变量设置位置

1. 登录Cloudflare Dashboard
2. 进入 Pages > 你的项目
3. 点击 "Settings" > "Environment variables"
4. 添加上述环境变量

### 4. 数据库配置

项目使用Supabase PostgreSQL作为数据库提供商：

1. 在 [Supabase](https://supabase.com) 创建项目
2. 进入项目 Settings > Database
3. 复制 Connection string (选择 Transactional 模式)
4. 将连接字符串设置为 `DATABASE_URL` 环境变量

Supabase连接字符串格式：

```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

## 验证部署

部署成功后，验证以下功能：

### API端点测试

```bash
# 测试 updates API
curl "https://your-domain.com/api/updates?date=2024-01-01"

# 测试 books API
curl "https://your-domain.com/api/books"
```

### 页面测试

- 首页: `https://your-domain.com`
- 博客列表: `https://your-domain.com/blog`
- 书籍浏览: `https://your-domain.com/books`

## 常见问题

### Q: 构建失败，提示数据库连接错误

A: 确保 `DATABASE_URL` 环境变量已正确配置，使用Supabase的Transactional模式连接字符串

### Q: SEO提交仍然失败

A: 这是预期的，除非你配置了 `SEO_SUBMIT_URL`。现在失败不会阻止构建

### Q: IndexedDB警告

A: 这是构建时的正常警告，运行时在浏览器中会正常工作

### Q: 图片加载失败

A: 检查 `NEXT_PUBLIC_BASE_URL` 是否正确配置

## 性能优化建议

1. **启用缓存**: Cloudflare自动缓存静态资源
2. **使用R2存储**: 对于大量静态资源，考虑使用Cloudflare R2
3. **监控性能**: 使用Cloudflare Analytics监控性能

## 后续维护

### 定期任务

项目包含cron任务，需要配置：

- 每日书籍更新
- 标签分析
- 站点地图更新

这些可以通过Cloudflare Cron Triggers或外部cron服务配置。

## 技术支持

如遇到问题，检查：

1. Cloudflare Pages构建日志
2. 运行时错误（通过Cloudflare Analytics）
3. 数据库连接状态
