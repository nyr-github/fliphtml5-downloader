/**
 * Pollinations AI API客户端
 * 提供OpenAI兼容的chat completions API
 */

// API端点配置
const BASE_URL = "https://gen.pollinations.ai";

export const endpoints = {
  text: `${BASE_URL}/text`,
  image: `${BASE_URL}/image`,
  chatCompletions: `${BASE_URL}/v1/chat/completions`,
} as const;

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
}

export interface ChatCompletionOptions {
  /** AI模型,默认openai */
  model?: string;
  /** 对话消息数组 */
  messages: ChatMessage[];
  /** 最大生成token数,默认300 */
  max_tokens?: number;
  /** 创意度(0-2),默认1。越低越聚焦,越高越创意 */
  temperature?: number;
  /** 是否启用JSON模式,默认false */
  json?: boolean;
}

export interface ChatCompletionResponse {
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

/**
 * Chat completions API (OpenAI compatible)
 * 使用 Pollinations AI 的 chat completions API
 *
 * @param options - Chat completion选项
 * @returns API响应
 *
 * @example
 * // 简单对话
 * const result = await chatCompletion({
 *   messages: [{ role: "user", content: "Hello!" }],
 * });
 *
 * @example
 * // JSON模式
 * const data = await chatCompletion({
 *   model: "openai",
 *   messages: [{ role: "user", content: "生成JSON" }],
 *   max_tokens: 200,
 *   json: true,
 * });
 */
export async function chatCompletion(
  options: ChatCompletionOptions,
): Promise<ChatCompletionResponse> {
  const {
    model = "openai",
    messages,
    max_tokens = 300,
    temperature = 1,
    json = false,
  } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // 如果配置了API KEY,添加到请求头
  const apiKey = process.env.POLLINATION_API_KEY;
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  const response = await fetch(endpoints.chatCompletions, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      messages,
      max_tokens,
      temperature,
      ...(json ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Pollinations AI request failed: ${response.status} ${response.statusText}`,
    );
  }

  return await response.json();
}

/**
 * 简化版文本生成API
 * 适用于简单的单轮对话
 *
 * @param prompt - 提示文本
 * @param options - 可选配置
 * @returns 生成的文本
 *
 * @example
 * const text = await generateText("写一首关于AI的诗");
 */
export async function generateText(
  prompt: string,
  options?: {
    model?: string;
    max_tokens?: number;
    temperature?: number;
  },
): Promise<string> {
  const response = await chatCompletion({
    model: options?.model || "openai",
    messages: [{ role: "user", content: prompt }],
    max_tokens: options?.max_tokens || 300,
    temperature: options?.temperature ?? 1,
  });

  return response.choices?.[0]?.message?.content || "";
}
