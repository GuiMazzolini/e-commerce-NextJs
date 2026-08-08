import type { Metadata } from "next";
import { connectToDB } from "@/app/api/db";
import { getAvailableStock } from "@/app/lib/cart-limits";
import { products as productsCollection } from "@/app/lib/db-collections";
import AdminProductsTable from "./AdminProductsTable";

export const metadata: Metadata = {
  title: "Admin — Products",
  robots: { index: false, follow: false },
};

export default async function AdminProductsPage() {
  const { db } = await connectToDB();
  const docs = await productsCollection(db).find({}).sort({ name: 1 }).toArray();
  const products = docs.map((doc) => ({
    id: doc.id,
    name: doc.name,
    price: doc.price,
    imageUrl: doc.imageUrl,
    stock: getAvailableStock(doc.stock),
  }));

  return (
    <div>
      <p className="mb-6 text-gray-600">
        Manage catalog inventory, pricing, and product images.
      </p>
      <AdminProductsTable products={products} />
    </div>
  );
}
