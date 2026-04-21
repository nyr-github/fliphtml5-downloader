import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://yourdomain.com";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/api/",
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
