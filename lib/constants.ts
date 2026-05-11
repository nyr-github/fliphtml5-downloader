// 预设书籍标签常量
export const BOOK_TAGS = [
  "Business",
  "Sustainability",
  "Social Issues",
  "Arts & Culture",
  "Lifestyle",
  "Design",
  "Science & Technology",
  "Health",
  "Education",
  "Real Estate",
  "Environment",
  "Nature",
] as const;

export type BookTag = (typeof BOOK_TAGS)[number];

// 标签名称转URL slug的工具函数
export const tagToSlug = (tag: string): string => {
  return tag
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
};

// URL slug转标签名称的工具函数
export const slugToTag = (slug: string): string | undefined => {
  return BOOK_TAGS.find((tag) => tagToSlug(tag) === slug);
};
