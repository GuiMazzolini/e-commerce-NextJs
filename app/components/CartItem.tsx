"use client";

import Link from "next/link";
import Image from "next/image";
import { Product } from "../product-data";
import { useCartStore } from "../lib/store/cartStore";

interface CartItemProps {
  product: Product;
}

export default function CartItem({ product }: CartItemProps) {
    const updateQuantity = useCartStore((s) => s.updateQuantity);
    const removeFromCart = useCartStore((s) => s.removeFromCart);
    const isLoading = useCartStore((s) => s.isLoading);

    const loading = isLoading(product.id);

    const quantity = product.quantity || 1;


  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="flex flex-col sm:flex-row">
        <Link
          href={`/products/${product.id}`}
          className="sm:w-48 h-48 sm:h-auto relative bg-gray-100 shrink-0"
        >
          <Image
            src={`/${product.imageUrl}`}
            alt={product.name}
            fill
            className="object-cover hover:scale-105 transition-transform duration-300"
          />
        </Link>

        <div className="flex-1 p-6 flex flex-col justify-between">
          <div>
            <Link href={`/products/${product.id}`} className="block">
              <h3 className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors mb-2">
                {product.name}
              </h3>
            </Link>

            <p className="text-gray-600 text-sm line-clamp-2 mb-4">
              {product.description}
            </p>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="text-2xl font-bold text-blue-600">
              ${(product.price * quantity).toFixed(2)}

              {quantity > 1 && (
                <span className="text-sm text-gray-500 ml-2">
                  (${product.price.toFixed(2)} each)
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center border border-gray-300 rounded-lg">
                {quantity <= 1 ? (
                  <button
                    onClick={() => removeFromCart(product.id)}
                    disabled={loading}
                    aria-label="Remove from cart"
                    className="px-3 py-2 text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={() => updateQuantity(product.id, quantity - 1)}
                    disabled={loading}
                    aria-label="Decrease quantity"
                    className="px-3 py-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    −
                  </button>
                )}

                <span className="px-4 py-2 font-semibold min-w-12 text-center">
                  {loading ? "..." : quantity}
                </span>

                <button
                  onClick={() =>
                    updateQuantity(product.id, quantity + 1)
                  }
                  disabled={loading}
                  aria-label="Increase quantity"
                  className="px-3 py-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
