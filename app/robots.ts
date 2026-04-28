import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin/", "/login", "/signup", "/billing/"],
    },
    sitemap: "https://brify.app/sitemap.xml",
    host: "https://brify.app",
  };
}
