import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connectToDB } from "@/app/api/db";
import { getAvailableStock } from "@/app/lib/cart-limits";
import ProductDetail from "./ProductDetail";

type Params = { id: string };

type DBProduct = {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  stock: number;
};

async function getProduct(id: string): Promise<DBProduct | null> {
  const { db } = await connectToDB();
  const product = await db.collection("products").findOne({ id });
  if (!product) return null;

  return {
    id: product.id,
    name: product.name,
    price: product.price,
    description: product.description,
    imageUrl: product.imageUrl,
    stock: getAvailableStock(product.stock),
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) {
    return { title: "Product not found" };
  }

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: product.imageUrl ? [`/${product.imageUrl}`] : undefined,
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  return <ProductDetail product={product} />;
}
