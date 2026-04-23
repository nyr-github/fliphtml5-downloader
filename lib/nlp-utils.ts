import nlp from "compromise";

/**
 * 从标题中提取NLP实体（名词、专有名词等）
 * @param title 书籍标题
 * @returns 提取的实体数组，按相关性排序
 */
export function extractEntities(title: string): string[] {
  if (!title || title.trim().length === 0) {
    return [];
  }

  const doc = nlp(title);

  // 提取各种实体
  const entities: string[] = [];

  // 1. 提取专有名词（人名、地名、组织名等）
  const properNouns = doc.match("#ProperNoun").out("array");
  entities.push(...properNouns);

  // 2. 提取名词短语
  const nounPhrases = doc.match("#Noun+").out("array");
  entities.push(...nounPhrases);

  // 3. 提取单独的名词
  const nouns = doc.match("#Noun").out("array");
  entities.push(...nouns);

  // 去重并过滤掉太短的词条（< 2字符）
  const uniqueEntities = [...new Set(entities)]
    .map((e) => e.trim())
    .filter(
      (e) =>
        e.length >= 2 &&
        !/^(a|an|the|and|or|but|in|on|at|to|for|of|with|by)$/i.test(e),
    );

  return uniqueEntities;
}

/**
 * 获取标题中的第一个主要实体
 * @param title 书籍标题
 * @returns 第一个主要实体，如果没有则返回空字符串
 */
export function getPrimaryEntity(title: string): string {
  const entities = extractEntities(title);
  return entities.length > 0 ? entities[0] : "";
}

/**
 * 构建搜索关键词（基于实体）
 * @param title 书籍标题
 * @returns 用于数据库搜索的关键词字符串
 */
export function buildSearchKeywords(title: string): string {
  const entities = extractEntities(title);
  // 取前3个实体作为搜索关键词
  return entities.slice(0, 3).join(" ");
}
