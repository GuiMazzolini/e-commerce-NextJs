"use client";

import { useMemo, useState } from "react";
import { Product } from "../product-data";
import Image from "next/image";
import Link from "next/link";
import { getImageSrc } from "../lib/images";
import { useCartStore } from "../lib/store/cartStore";
import CartErrorBanner from "./CartErrorBanner";

type SortOption = "name-asc" | "price-asc" | "price-desc" | "stock-desc";

export default function ProductsList({ products }: { products: Product[] }) {
  const { cartProducts, addToCart, updateQuantity, isLoading } = useCartStore();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortOption>("name-asc");

  function cartEntry(productId: string) {
    return cartProducts.find((cp) => cp.id === productId);
  }

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();

    let next = products.filter((product) => {
      return (
        !q ||
        product.name.toLowerCase().includes(q) ||
        product.description.toLowerCase().includes(q)
      );
    });

    next = [...next].sort((a, b) => {
      switch (sort) {
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "stock-desc":
          return b.stock - a.stock;
        case "name-asc":
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return next;
  }, [products, query, sort]);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Our Products</h1>
            <p className="mt-2 text-gray-600">
              {filteredProducts.length} of {products.length} products
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:w-xl">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">
                Search
              </span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Name or description"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              />
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
                <option value="stock-desc">Stock: high to low</option>
              </select>
            </label>
          </div>
        </div>

        <CartErrorBanner />

        {filteredProducts.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No products match
            </h2>
            <p className="text-gray-600 mb-6">
              Try a different search term or reset the filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSort("name-asc");
              }}
              className="inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const entry = cartEntry(product.id);
              const inCart = !!entry;
              const quantity = entry?.quantity || 0;
              const loading = isLoading(product.id);
              const outOfStock = product.stock < 1;
              const atStockLimit = quantity >= product.stock;

              return (
                <div key={product.id} className="group">
                  <Link href={`/products/${product.id}`}>
                    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                      <div className="relative w-full aspect-square bg-gray-100">
                        <Image
                          src={getImageSrc(product.imageUrl)}
                          alt={product.name}
                          fill
                          unoptimized
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {outOfStock && (
                          <span className="absolute left-3 top-3 rounded-md bg-red-600 px-2 py-1 text-xs font-semibold text-white">
                            Out of stock
                          </span>
                        )}
                      </div>

                      <div className="p-4">
                        <h2 className="text-lg font-semibold mb-2 group-hover:text-blue-600 transition-colors">
                          {product.name}
                        </h2>

                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-2xl font-bold text-blue-600">
                            ${product.price.toFixed(2)}
                          </span>
                          {!outOfStock && (
                            <span className="text-xs text-gray-500">
                              {product.stock} left
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>

                  {inCart ? (
                    <div className="mt-3 flex items-center justify-between border border-gray-300 rounded-lg overflow-hidden">
                      <button
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        disabled={loading}
                        aria-label={
                          quantity <= 1 ? "Remove from cart" : "Decrease quantity"
                        }
                        className="px-4 py-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                      >
                        {quantity <= 1 ? (
                          <svg
                            className="w-4 h-4 text-red-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        ) : (
                          "−"
                        )}
                      </button>

                      <span className="font-semibold min-w-8 text-center">
                        {loading ? "..." : quantity}
                      </span>

                      <button
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        disabled={loading || atStockLimit}
                        aria-label="Increase quantity"
                        className="px-4 py-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(product)}
                      disabled={loading || outOfStock}
                      className={`
                        w-full mt-3 py-2 rounded-lg font-semibold
                        transition-all duration-200
                        ${
                          outOfStock
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }
                        ${loading && "opacity-50 cursor-not-allowed"}
                      `}
                    >
                      {loading
                        ? "Adding..."
                        : outOfStock
                          ? "Out of Stock"
                          : "Add to Cart"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
