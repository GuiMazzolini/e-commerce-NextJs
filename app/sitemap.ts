import type { MetadataRoute } from "next";
import { connectToDB } from "@/app/api/db";
import { getAppUrl } from "@/app/lib/stripe";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getAppUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/products`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/cart`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${base}/checkout`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${base}/orders/lookup`, changeFrequency: "monthly", priority: 0.4 },
  ];

  try {
    const { db } = await connectToDB();
    const products = await db
      .collection("products")
      .find({}, { projection: { id: 1 } })
      .toArray();

    const productRoutes: MetadataRoute.Sitemap = products.map(
      (doc: { id?: string }) => ({
        url: `${base}/products/${doc.id}`,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })
    );

    return [...staticRoutes, ...productRoutes];
  } catch {
    // Build/CI may not have a live DB — still publish core routes.
    return staticRoutes;
  }
}
