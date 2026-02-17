"use client";

import Link from "next/link";
import Image from "next/image";
import { Product } from "../product-data";

interface CartItemProps {
  product: Product;
  loading: boolean;
  onUpdateQuantity: (productId: string, newQuantity: number) => void;
  onRemove: (productId: string) => void;
}

export default function CartItem({ product, loading, onUpdateQuantity, onRemove }: CartItemProps) {
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
                <button
                  onClick={() =>
                    onUpdateQuantity(product.id, quantity - 1)
                  }
                  disabled={loading || quantity <= 1}
                  className="px-3 py-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  −
                </button>

                <span className="px-4 py-2 font-semibold min-w-12 text-center">
                  {loading ? "..." : quantity}
                </span>

                <button
                  onClick={() =>
                    onUpdateQuantity(product.id, quantity + 1)
                  }
                  disabled={loading}
                  className="px-3 py-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  +
                </button>
              </div>

              <button
                onClick={() => onRemove(product.id)}
                disabled={loading}
                className="px-4 py-2 rounded-lg font-semibold transition-all bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
