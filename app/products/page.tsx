import type { Metadata } from "next";
import { connectToDB } from "@/app/api/db";
import ProductsList from "../components/ProductsList";
import { getAvailableStock } from "@/app/lib/cart-limits";
import { products as productsCollection } from "@/app/lib/db-collections";
import type { Product } from "@/app/product-data";

export const metadata: Metadata = {
  title: "Products",
  description: "Browse the full StyleShop catalog and add your favorites to the cart.",
};

/**
 * Rendered per request: the catalog carries live stock counts, and a build-time
 * snapshot would show sold-out items as available until the next deploy.
 * It also keeps the build from requiring a reachable database.
 */
export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const { db } = await connectToDB();
  const products = await productsCollection(db).find({}).toArray();

  const serialized: Product[] = products.map(
    (doc) => ({
      id: doc.id,
      name: doc.name,
      price: doc.price,
      description: doc.description,
      imageUrl: doc.imageUrl,
      stock: getAvailableStock(doc.stock),
    })
  );

  return <ProductsList products={serialized} />;
}
