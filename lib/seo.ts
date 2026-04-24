/**
 * SEO 提交工具
 * 用于将页面提交到搜索引擎进行索引
 */

/**
 * 构建书籍详情页面URL
 * @param id1 FlipHTML5 书籍 ID1
 * @param id2 FlipHTML5 书籍 ID2
 * @returns 完整的书籍页面URL
 */
export function buildBookUrl(id1: string, id2: string): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://fliphtml5.aivaded.com";
  return `${baseUrl}/book/${id1}_${id2}`;
}

/**
 * 提交任意URL到搜索引擎进行SEO索引（通用函数）
 * @param url 要提交的完整URL
 * @param description 描述信息（用于日志记录）
 */
export async function submitUrlToSearchEngine(
  url: string,
  description: string = "page",
): Promise<void> {
  try {
    const seoSubmitUrl = process.env.SEO_SUBMIT_URL;
    if (!seoSubmitUrl) {
      console.warn("SEO_SUBMIT_URL not configured, skipping SEO submission");
      return;
    }

    const response = await fetch(seoSubmitUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: url,
      }),
    });

    if (!response.ok) {
      console.error(
        `SEO submission failed for ${description}: ${response.status} ${response.statusText}`,
      );
    } else {
      console.log(
        `Successfully submitted ${description} to search engine: ${url}`,
      );
    }
  } catch (error) {
    console.error(`Error submitting ${description} to search engine:`, error);
    throw error;
  }
}

/**
 * 提交书籍页面到搜索引擎进行SEO索引
 * @param id1 FlipHTML5 书籍 ID1
 * @param id2 FlipHTML5 书籍 ID2
 * @param title 书籍标题
 */
export async function submitBookToSearchEngine(
  id1: string,
  id2: string,
  title: string,
): Promise<void> {
  const bookUrl = buildBookUrl(id1, id2);
  await submitUrlToSearchEngine(bookUrl, `book "${title}"`);
}
