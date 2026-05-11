# 书籍AI标签自动分类系统

## 功能概述

系统会在每天凌晨1点自动运行,使用Pollination AI对数据库中没有标签的书籍进行智能分析,并自动添加最相关的标签。

## 工作流程

1. **定时触发**: Vercel Cron在每天凌晨1点(UTC时间)触发`/api/cron/tag-books`
2. **查询未标记书籍**: 从数据库查询所有没有标签或标签为空的书籍(每次最多50本)
3. **AI分析**: 使用Pollination AI根据书籍标题和描述分析内容主题
4. **标签分配**: 从预定义的12个标签中选择最多3个最相关的标签
5. **更新数据库**: 将分析得到的标签保存到书籍记录中
6. **日志记录**: 记录处理结果和统计信息

## 预定义标签

系统使用以下12个固定标签(定义在`lib/constants.ts`):

- Business
- Sustainability
- Social Issues
- Arts & Culture
- Lifestyle
- Design
- Science & Technology
- Health
- Education
- Real Estate
- Environment
- Nature

## 配置步骤

### 1. 设置CRON_SECRET环境变量

在Vercel项目设置中添加环境变量:

```bash
# 生成一个随机密钥
openssl rand -hex 32

# 在Vercel环境变量中添加
CRON_SECRET=your_generated_secret_here
```

### 2. 验证Cron配置

Vercel Cron已在`vercel.json`中配置:

```json
{
  "crons": [
    {
      "path": "/api/cron/tag-books",
      "schedule": "0 1 * * *"
    }
  ]
}
```

Cron表达式说明: `0 1 * * *` = 每天凌晨1点(UTC时间)

### 3. 命令行执行(本地测试和手动运行)

项目提供了CLI工具,可以直接通过npm脚本执行:

#### 基本用法

```bash
# 执行完整的标签分析
npm run tag-books

# Dry Run模式 - 仅查看未标记书籍,不执行分析
npm run tag-books:dry-run

# 或者使用参数
npm run tag-books -- --dry-run
```

#### 高级用法

```bash
# 限制处理数量(仅Dry Run模式有效)
npm run tag-books -- --dry-run --limit=10

# 查看帮助
npm run tag-books -- --help
```

#### CLI工具特性

- ✅ **直接调用**: 直接调用数据库函数,无需启动HTTP服务器
- ✅ **Dry Run模式**: 预览未标记书籍,不执行实际分析
- ✅ **参数控制**: 支持限制处理数量
- ✅ **详细日志**: 实时显示分析进度和结果
- ✅ **错误处理**: 完善的错误提示和退出码

### 4. 手动触发API(可选)

如果需要手动触发标签分析:

```bash
# 使用curl命令
curl -X GET "https://your-domain.com/api/cron/tag-books" \
  -H "Authorization: Bearer your_cron_secret"

# 或使用Postman等工具
GET https://your-domain.com/api/cron/tag-books
Header: Authorization: Bearer your_cron_secret
```

## API响应示例

### 成功响应

```json
{
  "success": true,
  "message": "Book tag analysis completed",
  "data": {
    "total": 25,
    "tagged": 23,
    "failed": 2
  },
  "timestamp": "2026-05-12T01:00:00.000Z"
}
```

### 错误响应

```json
{
  "success": false,
  "error": "Book tag analysis failed",
  "message": "Error details here",
  "timestamp": "2026-05-12T01:00:00.000Z"
}
```

## 实现细节

### AI分析逻辑

1. **chatCompletion封装**: 使用OpenAI兼容的API格式调用Pollinations AI
2. **JSON模式**: 启用`json: true`确保AI返回格式化的JSON数据
3. **响应解析**: 从AI返回的文本中提取JSON数组
4. **标签验证**: 确保返回的标签在预定义列表中
5. **数量限制**: 最多分配3个标签

### chatCompletion API

使用Pollinations AI的OpenAI兼容API:

```typescript
// API端点配置
const POLLINATIONS_BASE_URL = "https://gen.pollinations.ai";
const CHAT_COMPLETIONS_ENDPOINT = `${POLLINATIONS_BASE_URL}/v1/chat/completions`;

interface ChatCompletionOptions {
  model?: string; // AI模型,默认openai
  messages: Array<{
    // 对话消息
    role: string; // 角色: system/user/assistant
    content: string; // 消息内容
  }>;
  max_tokens?: number; // 最大token数,默认300
  temperature?: number; // 创意度(0-2),默认1
  json?: boolean; // JSON模式,默认false
}

async function chatCompletion(options: ChatCompletionOptions): Promise<any>;
```

**调用示例:**

```typescript
const response = await chatCompletion({
  model: "openai",
  messages: [{ role: "user", content: "你的prompt" }],
  max_tokens: 100,
  temperature: 0.3,
  json: true, // 启用JSON模式
});
```

**API端点说明:**

- 基础URL: `https://gen.pollinations.ai`
- Chat Completions: `https://gen.pollinations.ai/v1/chat/completions`
- 完全兼容OpenAI API格式

### 性能优化

- **批量处理**: 每次最多处理50本书,避免超时
- **请求延迟**: 每本书分析之间间隔2秒,避免API限流
- **缓存策略**: 标签查询结果会被缓存24小时
- **错误处理**: 单本书分析失败不影响其他书籍

### 数据库查询

使用PostgreSQL数组函数检测未标记书籍:

```sql
WHERE cardinality(tags) = 0 OR tags IS NULL
```

`cardinality()`函数返回数组元素个数,空数组返回0。

## 监控和调试

### CLI执行示例

#### Dry Run模式

```bash
$ npm run tag-books:dry-run

📋 Dry Run模式 - 查询未标记书籍

📋 可用标签 (12个):
   Business, Sustainability, Social Issues, Arts & Culture, Lifestyle, Design, Science & Technology, Health, Education, Real Estate, Environment, Nature

📚 找到 25 本未标记的书籍

1. Introduction to Business
   描述: A comprehensive guide to modern business practices...
   ID: abc123_def456

2. Sustainable Living Guide
   描述: Learn how to live a more sustainable lifestyle...
   ID: ghi789_jkl012

...

💡 提示: 运行 'npm run tag-books' 开始AI标签分析
```

#### 完整分析模式

```bash
$ npm run tag-books

🚀 启动书籍AI标签分析...

📋 可用标签 (12个):
   Business, Sustainability, Social Issues, Arts & Culture, Lifestyle, Design, Science & Technology, Health, Education, Real Estate, Environment, Nature

🚀 Starting book tag analysis...
📚 Found 25 untagged books to process...

[1/25] Analyzing: Introduction to Business
  → Tags: Business, Education

[2/25] Analyzing: Sustainable Living Guide
  → Tags: Sustainability, Lifestyle

✅ Tag analysis complete!
   Total processed: 25
   Successfully tagged: 23
   Failed: 2

✅ 标签分析完成!

📊 统计信息:
   总处理数量: 25
   成功标记: 23
   失败: 2
   时间: 2026-05-12T01:00:00.000Z
```

### 查看Vercel Cron日志

在Vercel Dashboard中查看函数执行日志:

- 筛选路径: `/api/cron/tag-books`
- 时间范围: 最近24小时

### 日志输出示例

```
🕐 Book tag analysis cron job triggered
🚀 Starting book tag analysis...
📚 Found 25 untagged books to process...

[1/25] Analyzing: Introduction to Business
  → Tags: Business, Education

[2/25] Analyzing: Sustainable Living Guide
  → Tags: Sustainability, Lifestyle

✅ Tag analysis complete!
   Total processed: 25
   Successfully tagged: 23
   Failed: 2
```

## 注意事项

1. **AI API限制**: Pollination AI可能有请求频率限制,已添加2秒延迟
2. **执行时间**: Vercel Serverless函数最长执行时间为10秒(免费)或60秒(Pro)
3. **标签质量**: AI分析的准确性取决于书籍标题和描述的质量
4. **重复执行**: 已标记的书籍不会重复分析,除非标签被清空

## 故障排除

### Cron未执行

1. 检查Vercel Cron配置是否正确
2. 确认环境变量CRON_SECRET已设置
3. 查看Vercel Dashboard中的Cron执行历史

### AI分析失败

1. 检查Pollination AI服务是否可用
2. 验证网络连接和防火墙设置
3. 查看函数日志中的错误信息

### 标签未更新

1. 确认数据库连接正常
2. 检查books表结构是否包含tags字段
3. 验证SQL查询是否正确

## 相关文件

- `lib/constants.ts` - 标签常量定义
- `lib/actions/tag-analysis.ts` - AI标签分析逻辑
- `app/api/cron/tag-books/route.ts` - Cron API路由
- `vercel.json` - Vercel Cron配置
