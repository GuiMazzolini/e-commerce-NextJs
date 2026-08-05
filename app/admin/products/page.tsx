import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { connectToDB } from "@/app/api/db";
import { getAvailableStock } from "@/app/lib/cart-limits";
import DeleteProductButton from "./DeleteProductButton";

export const metadata: Metadata = {
  title: "Admin — Products",
  robots: { index: false, follow: false },
};

export default async function AdminProductsPage() {
  const { db } = await connectToDB();
  const docs = await db.collection("products").find({}).sort({ name: 1 }).toArray();
  const products: {
    id: string;
    name: string;
    price: number;
    imageUrl: string;
    stock: number;
  }[] = docs.map((doc: Record<string, unknown>) => ({
    id: String(doc.id),
    name: String(doc.name),
    price: Number(doc.price),
    imageUrl: String(doc.imageUrl),
    stock: getAvailableStock(doc.stock),
  }));

  return (
    <div>
      <p className="mb-6 text-gray-600">
        {products.length} product{products.length === 1 ? "" : "s"} in the catalog.
      </p>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Product</th>
              <th className="px-4 py-3 font-semibold">Price</th>
              <th className="px-4 py-3 font-semibold">Stock</th>
              <th className="px-4 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      <Image
                        src={`/${product.imageUrl}`}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-700">${product.price.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      product.stock < 1
                        ? "font-semibold text-red-600"
                        : product.stock <= 5
                          ? "font-semibold text-amber-600"
                          : "text-gray-700"
                    }
                  >
                    {product.stock}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </Link>
                    <DeleteProductButton productId={product.id} productName={product.name} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
