import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "Yeti",
        allow: "/",
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/login",
          "/signup",
          "/billing/",
          "/maps",
          "/video-to-map",
          "/ko/login",
          "/en/login",
          "/fr/login",
          "/ko/signup",
          "/en/signup",
          "/fr/signup",
          "/ko/billing",
          "/en/billing",
          "/fr/billing",
          "/ko/maps",
          "/en/maps",
          "/fr/maps",
          "/ko/video-to-map",
          "/en/video-to-map",
          "/fr/video-to-map",
        ],
      },
    ],
    sitemap: "https://www.brify.app/sitemap.xml",
    host: "https://www.brify.app",
  };
}
