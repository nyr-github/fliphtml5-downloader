# 书籍AI标签系统 - 快速使用指南

## 📦 核心文件

| 文件                              | 说明                       |
| --------------------------------- | -------------------------- |
| `lib/constants.ts`                | 标签常量定义(12个预设标签) |
| `lib/actions/tag-analysis.ts`     | AI标签分析核心逻辑         |
| `app/api/cron/tag-books/route.ts` | Vercel Cron API端点        |
| `scripts/tag-books-cli.ts`        | CLI命令行工具              |
| `vercel.json`                     | 定时任务配置               |

## 🚀 快速开始

### 方式一: 使用CLI工具(推荐本地测试)

```bash
# 1. 查看未标记书籍(Dry Run)
npm run tag-books:dry-run

# 2. 执行AI标签分析
npm run tag-books

# 3. 限制处理数量(测试用)
npm run tag-books -- --dry-run --limit=5
```

### 方式二: Vercel Cron自动执行

定时任务已配置为每天凌晨1点(UTC)自动执行,无需手动干预。

## 📋 CLI命令说明

### 基本命令

```bash
# 完整标签分析
npm run tag-books

# Dry Run模式(仅查看,不修改数据)
npm run tag-books -- --dry-run
# 或使用快捷脚本
npm run tag-books:dry-run
```

### 高级参数

```bash
# 限制Dry Run显示数量
npm run tag-books -- --dry-run --limit=10

# 组合使用
npm run tag-books -- --dry-run --limit=5
```

## 🔧 环境变量配置

在`.env`文件中设置:

```env
# 数据库连接
DATABASE_URL=postgresql://...

# Cron任务安全密钥(生产环境必需)
CRON_SECRET=your_secret_key_here

# 应用基础URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## 📊 执行流程

```
启动CLI或Cron触发
    ↓
查询未标记书籍(最多50本)
    ↓
逐本调用Pollination AI
    ↓
AI分析标题和描述
    ↓
返回最多3个标签
    ↓
验证标签在BOOK_TAGS范围内
    ↓
更新数据库
    ↓
输出统计结果
```

## 💡 使用场景

### 场景1: 本地开发测试

```bash
# 1. 先Dry Run查看
npm run tag-books:dry-run

# 2. 确认无误后执行
npm run tag-books
```

### 场景2: 生产环境部署

部署到Vercel后,Cron会自动执行,无需手动操作。

查看日志: Vercel Dashboard → Logs → 筛选 `/api/cron/tag-books`

### 场景3: 手动补充标签

如果新增了大量书籍,可以手动触发:

```bash
# 本地执行
npm run tag-books

# 或调用生产环境API
curl -X GET "https://your-domain.vercel.app/api/cron/tag-books" \
  -H "Authorization: Bearer $CRON_SECRET"
```

## 🎯 标签范围

系统使用以下12个固定标签:

1. Business
2. Sustainability
3. Social Issues
4. Arts & Culture
5. Lifestyle
6. Design
7. Science & Technology
8. Health
9. Education
10. Real Estate
11. Environment
12. Nature

AI会从这12个标签中选择最多3个最相关的标签分配给每本书。

## ⚠️ 注意事项

1. **首次执行**: 可能需要较长时间(取决于未标记书籍数量)
2. **API限流**: 每本书分析间隔2秒,避免Pollination AI限流
3. **执行限制**: Vercel Serverless函数最长执行时间10秒(免费)或60秒(Pro)
4. **批量处理**: 每次最多处理50本书,未完成的会在下次Cron执行时继续
5. **安全密钥**: 生产环境务必设置CRON_SECRET

## 🐛 常见问题

### Q: CLI执行报错 "Cannot find module"

A: 确保已安装依赖: `npm install`

### Q: Dry Run显示0本未标记书籍

A: 说明所有书籍都已有标签,或数据库连接有问题

### Q: AI分析失败率高

A: 检查网络连接和Pollination AI服务状态

### Q: Cron未自动执行

A: 检查Vercel Dashboard中的Cron配置和执行历史

## 📖 完整文档

详细文档请查看: [TAG_ANALYSIS_CRON.md](./TAG_ANALYSIS_CRON.md)
