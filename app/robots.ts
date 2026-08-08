import type { MetadataRoute } from "next";
import { getAppUrl } from "@/app/lib/stripe";

export default function robots(): MetadataRoute.Robots {
  const base = getAppUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/", "/checkout/success"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
