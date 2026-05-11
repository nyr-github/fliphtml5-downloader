# Pollinations AI API 使用指南

## 概述

项目集成了Pollinations AI的OpenAI兼容API,提供免费的AI文本和图像生成功能。

## API端点

```typescript
const BASE_URL = "https://gen.pollinations.ai";

endpoints = {
  text: `${BASE_URL}/text`, // 简单文本生成
  image: `${BASE_URL}/image`, // 图像生成
  chatCompletions: `${BASE_URL}/v1/chat/completions`, // Chat Completions API
};
```

## 快速开始

### 1. 导入模块

```typescript
import { chatCompletion, generateText } from "@/lib/pollinations";
```

### 2. 基本使用

#### 简单文本生成

```typescript
// 最简单的用法
const text = await generateText("写一首关于AI的诗");
console.log(text);
```

#### Chat Completions API

```typescript
import { chatCompletion } from "@/lib/pollinations";

const response = await chatCompletion({
  model: "openai",
  messages: [
    { role: "system", content: "你是一个助手" },
    { role: "user", content: "你好!" },
  ],
  max_tokens: 100,
  temperature: 0.7,
});

console.log(response.choices[0].message.content);
```

## API参考

### chatCompletion

完整的OpenAI兼容API。

```typescript
interface ChatCompletionOptions {
  model?: string; // AI模型,默认"openai"
  messages: ChatMessage[]; // 对话消息数组
  max_tokens?: number; // 最大token数,默认300
  temperature?: number; // 创意度(0-2),默认1
  json?: boolean; // JSON模式,默认false
}

interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
}

async function chatCompletion(
  options: ChatCompletionOptions,
): Promise<ChatCompletionResponse>;
```

**参数说明:**

| 参数        | 类型          | 默认值   | 说明             |
| ----------- | ------------- | -------- | ---------------- |
| model       | string        | "openai" | AI模型名称       |
| messages    | ChatMessage[] | 必需     | 对话消息数组     |
| max_tokens  | number        | 300      | 最大生成token数  |
| temperature | number        | 1        | 创意度,0-2之间   |
| json        | boolean       | false    | 是否启用JSON模式 |

**返回值:**

```typescript
interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
```

### generateText

简化版API,适用于简单单轮对话。

```typescript
async function generateText(
  prompt: string,
  options?: {
    model?: string;
    max_tokens?: number;
    temperature?: number;
  },
): Promise<string>;
```

## 使用示例

### 示例1: JSON数据生成

```typescript
const response = await chatCompletion({
  model: "openai",
  messages: [
    {
      role: "user",
      content: "生成一个用户信息JSON,包含name, age, email字段",
    },
  ],
  max_tokens: 100,
  json: true, // 启用JSON模式
});

const data = JSON.parse(response.choices[0].message.content);
console.log(data); // { name: "...", age: 25, email: "..." }
```

### 示例2: 多轮对话

```typescript
const response = await chatCompletion({
  messages: [
    { role: "system", content: "你是一个专业的程序员助手" },
    { role: "user", content: "JavaScript中什么是闭包?" },
    {
      role: "assistant",
      content: "闭包是...",
    },
    { role: "user", content: "能举个例子吗?" },
  ],
  max_tokens: 200,
  temperature: 0.7,
});
```

### 示例3: 创意写作

```typescript
const story = await generateText("写一个关于未来世界的短篇科幻故事", {
  max_tokens: 500,
  temperature: 1.5, // 更高的创意度
});
```

### 示例4: 数据分析

```typescript
const analysis = await chatCompletion({
  messages: [
    {
      role: "user",
      content: `分析以下数据并返回JSON:
      销售额: 10000, 利润: 3000, 增长率: 15%`,
    },
  ],
  json: true,
});

const result = JSON.parse(analysis.choices[0].message.content);
```

### 示例5: 书籍标签分析(实际项目用法)

```typescript
import { BOOK_TAGS } from "@/lib/constants";
import { chatCompletion } from "@/lib/pollinations";

async function analyzeBookTags(title: string, description: string) {
  const prompt = `分析这本书并分配最多3个标签:
  
  可用标签: ${BOOK_TAGS.join(", ")}
  
  书名: ${title}
  描述: ${description}
  
  返回JSON数组格式: ["标签1", "标签2"]`;

  const response = await chatCompletion({
    model: "openai",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 100,
    temperature: 0.3,
    json: true,
  });

  const tags = JSON.parse(response.choices[0].message.content);
  return tags;
}
```

## 可用模型

使用`listTextModels`可以获取所有可用模型列表。常用模型:

- `openai` - 默认模型,通用性强
- `openai-large` - 更强推理能力
- `gemini` - Google Gemini模型
- `kimi-k2-thinking` - 深度推理模型

## 最佳实践

1. **JSON模式**: 需要结构化数据时启用`json: true`
2. **温度设置**:
   - 0.1-0.5: 事实性、代码生成
   - 0.7-1.0: 通用对话
   - 1.2-2.0: 创意写作
3. **Token限制**: 根据需求调整`max_tokens`,避免浪费
4. **错误处理**: 始终使用try-catch包裹API调用
5. **请求频率**: 避免过快发送请求,建议间隔1-2秒

## 错误处理

```typescript
try {
  const response = await chatCompletion({
    messages: [{ role: "user", content: "Hello" }],
  });
  console.log(response.choices[0].message.content);
} catch (error) {
  console.error("AI请求失败:", error.message);
  // 处理错误...
}
```

## 注意事项

- ✅ **免费使用**: Pollinations AI完全免费,无需API密钥
- ✅ **无限制**: 没有严格的速率限制
- ⚠️ **响应时间**: 可能需要1-5秒,取决于模型和复杂度
- ⚠️ **网络要求**: 需要互联网连接

## 相关文件

- `lib/pollinations.ts` - API客户端实现
- `lib/actions/tag-analysis.ts` - 实际使用示例
- `TAG_ANALYSIS_CRON.md` - 详细文档

## 更多信息

- [Pollinations官网](https://pollinations.ai)
- [API文档](https://docs.pollinations.ai)
- [GitHub仓库](https://github.com/pollinations/pollinations)
