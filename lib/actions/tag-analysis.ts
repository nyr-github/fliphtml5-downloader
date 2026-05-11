import { db } from "@/lib/db";
import { books } from "@/lib/db/schema";
import { eq, sql, asc } from "drizzle-orm";
import { BOOK_TAGS } from "@/lib/constants";
import { chatCompletion } from "@/lib/pollinations";

interface BookToTag {
  id: string;
  title: string;
  description: string | null;
}

// 使用 Pollination AI 分析书籍标签
async function analyzeBookTagsWithAI(
  title: string,
  description: string | null,
): Promise<string[]> {
  try {
    const prompt = `Analyze this book and return 1-3 relevant tags as a JSON array.

AVAILABLE TAGS (choose ONLY from this list):
${BOOK_TAGS.join(", ")}

BOOK INFORMATION:
Title: ${title}
Description: ${description || "(No description provided)"}

IMPORTANT RULES:
1. You MUST select at least ONE tag - never return an empty array
2. If you're unsure about the topic, default to ["Education"]
3. Choose 1-3 most relevant tags from the available tags list above
4. Return ONLY a valid JSON array, nothing else
5. Format: ["Tag1", "Tag2"] or ["Tag1"]
6. Do NOT include any explanation, just the JSON array

EXAMPLES:
- For a textbook: ["Education"]
- For a business magazine: ["Business"]
- For an environmental report: ["Environment", "Sustainability"]
- For unclear content: ["Education"] (default fallback)

YOUR RESPONSE (JSON array with at least 1 tag):`;

    // 使用chatCompletion API调用Pollinations AI
    const response = await chatCompletion({
      model: "openai",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 100,
      temperature: 0.2, // 降低随机性,更稳定的输出
      json: true, // 启用JSON模式
    });

    // 解析AI响应
    const aiResponse = response.choices?.[0]?.message?.content || "";

    // 解析标签
    const tags = parseTagsFromAIResponse(aiResponse);

    // 如果AI没有返回任何标签,默认使用Education
    if (tags.length === 0) {
      console.log("  → AI returned no tags, defaulting to Education");
      return ["Education"];
    }

    return tags;
  } catch (error) {
    console.error("Error analyzing book tags with AI:", error);
    return [];
  }
}

// 从AI响应中解析标签
function parseTagsFromAIResponse(response: string): string[] {
  try {
    // 清理响应文本
    let cleanedResponse = response.trim();

    // 情况1: 响应本身是字符串形式的JSON,如 "[\"Business\"]"
    // 先尝试直接解析整个响应
    try {
      const directParse = JSON.parse(cleanedResponse);
      // 检查是否是错误响应
      if (directParse && typeof directParse === "object" && directParse.error) {
        console.log("  ⚠️ AI returned error:", directParse.error);
        return [];
      }
      // 如果是正常的标签数组
      if (Array.isArray(directParse)) {
        return validateAndFilterTags(directParse);
      }
      // 如果解析后是字符串,再次解析(双重编码的情况)
      if (typeof directParse === "string") {
        const secondParse = JSON.parse(directParse);
        if (Array.isArray(secondParse)) {
          return validateAndFilterTags(secondParse);
        }
      }
    } catch {
      // 直接解析失败,继续尝试其他方式
    }

    // 情况2: 从文本中提取JSON数组
    const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          return validateAndFilterTags(parsed);
        }
      } catch {
        // JSON数组解析失败,继续尝试
      }
    }

    // 情况3: 尝试从代码块中提取
    const codeBlockMatch = cleanedResponse.match(
      /```(?:json)?\s*([\s\S]*?)```/,
    );
    if (codeBlockMatch) {
      try {
        const parsed = JSON.parse(codeBlockMatch[1].trim());
        if (Array.isArray(parsed)) {
          return validateAndFilterTags(parsed);
        }
      } catch {
        // 代码块解析失败
      }
    }

    console.warn("Could not parse AI response as tags array:", response);
    return [];
  } catch (error) {
    console.error("Error parsing AI response:", error);
    return [];
  }
}

// 验证并过滤标签
function validateAndFilterTags(tags: any[]): string[] {
  return tags
    .filter((tag): tag is string => typeof tag === "string")
    .map((tag) => tag.trim())
    .filter((tag) => BOOK_TAGS.includes(tag as any))
    .slice(0, 3); // 最多3个标签
}

// 获取所有没有标签的书籍
export async function getUntaggedBooks(options?: {
  limit?: number;
}): Promise<BookToTag[]> {
  try {
    const baseQuery = db
      .select({
        id: books.id,
        title: books.title,
        description: books.description,
      })
      .from(books)
      .where(sql`cardinality(${books.tags}) = 0 OR ${books.tags} IS NULL`)
      .orderBy(asc(books.createdAt));

    // 如果指定了limit,添加限制(用于Cron任务避免超时)
    const query = options?.limit ? baseQuery.limit(options.limit) : baseQuery;
    const untaggedBooks = await query;

    return untaggedBooks;
  } catch (error) {
    console.error("Error fetching untagged books:", error);
    return [];
  }
}

// 为单本书添加标签
export async function tagBook(bookId: string, tags: string[]): Promise<void> {
  try {
    await db
      .update(books)
      .set({
        tags: tags,
        updatedAt: new Date(),
      })
      .where(eq(books.id, bookId));

    console.log(`✓ Tagged book ${bookId} with: ${tags.join(", ")}`);
  } catch (error) {
    console.error(`Error tagging book ${bookId}:`, error);
  }
}

// 主函数:批量分析并标记书籍
export async function analyzeAndTagUntaggedBooks(options?: {
  limit?: number;
}): Promise<{
  total: number;
  tagged: number;
  failed: number;
}> {
  console.log("🚀 Starting book tag analysis...");

  // Cron任务限制50本,CLI模式不限制
  const untaggedBooks = await getUntaggedBooks({
    limit: options?.limit || undefined,
  });
  const total = untaggedBooks.length;

  if (total === 0) {
    console.log("✅ No untagged books found. All books are already tagged!");
    return { total: 0, tagged: 0, failed: 0 };
  }

  console.log(`📚 Found ${total} untagged books to process...`);

  let tagged = 0;
  let failed = 0;

  for (let i = 0; i < untaggedBooks.length; i++) {
    const book = untaggedBooks[i];
    console.log(`\n[${i + 1}/${total}] Analyzing: ${book.title}`);

    // 添加延迟避免请求过快
    if (i > 0) {
      await sleep(2000); // 2秒延迟
    }

    const tags = await analyzeBookTagsWithAI(book.title, book.description);

    if (tags.length > 0) {
      await tagBook(book.id, tags);
      tagged++;
      console.log(`  → Tags: ${tags.join(", ")}`);
    } else {
      // 理论上不会到这里,因为analyzeBookTagsWithAI已经有兜底逻辑
      failed++;
      console.log(`  → ⚠️ Failed to assign any tags`);
    }
  }

  console.log(`\n✅ Tag analysis complete!`);
  console.log(`   Total processed: ${total}`);
  console.log(`   Successfully tagged: ${tagged}`);
  console.log(`   Failed: ${failed}`);

  return { total, tagged, failed };
}

// 辅助函数:延迟
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
