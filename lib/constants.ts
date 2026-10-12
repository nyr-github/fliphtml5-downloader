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

// Discord 官方社区邀请链接（与 Navbar/Footer/QA 页保持一致）
export const DISCORD_INVITE_URL = "https://discord.gg/pcBqzNwFq";

// X（Twitter）官方账号：不定期发放免费通行证兑换码
export const X_PROFILE_URL = "https://x.com/aivaded";

// 站点对外主域：后台推广/分享文案固定用它，避免复制到 workers.dev 等临时访问域名
export const SITE_URL = "https://fliphtml5.aivaded.com";
