import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connectToDB } from "@/app/api/db";
import { getAvailableStock } from "@/app/lib/cart-limits";
import { products } from "@/app/lib/db-collections";
import ProductForm from "../../ProductForm";

type Params = { id: string };

export const metadata: Metadata = {
  title: "Admin — Edit product",
  robots: { index: false, follow: false },
};

export default async function EditProductPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const { db } = await connectToDB();
  const product = await products(db).findOne({ id });
  if (!product) notFound();

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold text-gray-900">Edit {product.name}</h2>
      <ProductForm
        mode="edit"
        initial={{
          id: product.id,
          name: product.name,
          description: product.description,
          imageUrl: product.imageUrl,
          price: product.price,
          stock: getAvailableStock(product.stock),
        }}
      />
    </div>
  );
}
