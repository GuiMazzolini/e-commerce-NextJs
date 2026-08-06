"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { getImageSrc } from "@/app/lib/images";
import DeleteProductButton from "./DeleteProductButton";

export type AdminProduct = {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  stock: number;
};

type StockFilter = "all" | "in-stock" | "low-stock" | "out-of-stock";
type SortOption = "name-asc" | "price-asc" | "price-desc" | "stock-asc";

const LOW_STOCK_THRESHOLD = 5;

export default function AdminProductsTable({
  products,
}: {
  products: AdminProduct[];
}) {
  const [query, setQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [sort, setSort] = useState<SortOption>("name-asc");

  const lowStockCount = products.filter(
    (p) => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD
  ).length;
  const outOfStockCount = products.filter((p) => p.stock < 1).length;

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();

    let next = products.filter((product) => {
      const matchesQuery =
        !q ||
        product.name.toLowerCase().includes(q) ||
        product.id.toLowerCase().includes(q);

      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "in-stock" && product.stock > LOW_STOCK_THRESHOLD) ||
        (stockFilter === "low-stock" &&
          product.stock > 0 &&
          product.stock <= LOW_STOCK_THRESHOLD) ||
        (stockFilter === "out-of-stock" && product.stock < 1);

      return matchesQuery && matchesStock;
    });

    next = [...next].sort((a, b) => {
      switch (sort) {
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "stock-asc":
          return a.stock - b.stock;
        case "name-asc":
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return next;
  }, [products, query, stockFilter, sort]);

  return (
    <div className="space-y-6">
      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">Inventory attention needed</p>
          <p className="mt-1">
            {outOfStockCount > 0 && (
              <span>
                {outOfStockCount} out of stock
                {lowStockCount > 0 ? " · " : ""}
              </span>
            )}
            {lowStockCount > 0 && (
              <span>
                {lowStockCount} low stock (≤ {LOW_STOCK_THRESHOLD})
              </span>
            )}
            . Use the filters below to review them.
          </p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">
            Search
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name or id"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">
            Stock filter
          </span>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as StockFilter)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            <option value="all">All products</option>
            <option value="in-stock">Healthy stock</option>
            <option value="low-stock">Low stock</option>
            <option value="out-of-stock">Out of stock</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">
            Sort
          </span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            <option value="name-asc">Name A–Z</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="stock-asc">Stock: low to high</option>
          </select>
        </label>
      </div>

      <p className="text-sm text-gray-600">
        Showing {filteredProducts.length} of {products.length} products
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
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-gray-500">
                  No products match these filters.
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        <Image
                          src={getImageSrc(product.imageUrl)}
                          alt=""
                          fill
                          unoptimized
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
                  <td className="px-4 py-3 text-gray-700">
                    ${product.price.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        product.stock < 1
                          ? "font-semibold text-red-600"
                          : product.stock <= LOW_STOCK_THRESHOLD
                            ? "font-semibold text-amber-600"
                            : "text-gray-700"
                      }
                    >
                      {product.stock}
                      {product.stock < 1
                        ? " · Out"
                        : product.stock <= LOW_STOCK_THRESHOLD
                          ? " · Low"
                          : ""}
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
                      <DeleteProductButton
                        productId={product.id}
                        productName={product.name}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
