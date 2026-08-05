import type { Metadata } from "next";
import { connectToDB } from "@/app/api/db";
import ProductsList from "../components/ProductsList";
import { getAvailableStock } from "@/app/lib/cart-limits";
import type { Product } from "@/app/product-data";

export const metadata: Metadata = {
  title: "Products",
  description: "Browse the full StyleShop catalog and add your favorites to the cart.",
};

export default async function ProductsPage() {
  const { db } = await connectToDB();
  const products = await db.collection("products").find({}).toArray();

  const serialized: Product[] = products.map(
    (doc: {
      id: string;
      name: string;
      price: number;
      description: string;
      imageUrl: string;
      stock?: number;
    }) => ({
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
