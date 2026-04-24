/**
 * SEO 提交工具
 * 用于将页面提交到搜索引擎进行索引
 */

/**
 * 提交书籍页面到搜索引擎进行SEO索引
 * @param id1 FlipHTML5 书籍 ID1
 * @param id2 FlipHTML5 书籍 ID2
 * @param title 书籍标题
 */
export async function submitToSearchEngine(
  id1: string,
  id2: string,
  title: string,
): Promise<void> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || "https://fliphtml5.aivaded.com";
    const bookUrl = `${baseUrl}/book/${id1}_${id2}`;

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
        url: bookUrl,
      }),
    });

    if (!response.ok) {
      console.error(
        `SEO submission failed for "${title}": ${response.status} ${response.statusText}`,
      );
    } else {
      console.log(
        `Successfully submitted "${title}" to search engine: ${bookUrl}`,
      );
    }
  } catch (error) {
    console.error(`Error submitting "${title}" to search engine:`, error);
    throw error;
  }
}
