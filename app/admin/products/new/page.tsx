import type { Metadata } from "next";
import ProductForm from "../ProductForm";

export const metadata: Metadata = {
  title: "Admin — New product",
  robots: { index: false, follow: false },
};

export default function NewProductPage() {
  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold text-gray-900">Add product</h2>
      <ProductForm mode="create" />
    </div>
  );
}
