"use client";

import Image from "next/image";
import { useState } from "react";
import CartErrorBanner from "@/app/components/CartErrorBanner";
import { getImageSrc } from "@/app/lib/images";
import { useCartStore } from "@/app/lib/store/cartStore";
import { useCheckout } from "@/app/lib/use-checkout";
import type { Product } from "@/app/product-data";

type ProductDetailProps = {
  product: Product;
};

export default function ProductDetail({ product }: ProductDetailProps) {
  const [buyingNow, setBuyingNow] = useState(false);

  const cartProducts = useCartStore((s) => s.cartProducts);
  const addToCart = useCartStore((s) => s.addToCart);
  const removeFromCart = useCartStore((s) => s.removeFromCart);
  const isLoading = useCartStore((s) => s.isLoading);

  const { startCheckout, loading: checkoutLoading } = useCheckout();

  const inCart = cartProducts.some((p) => p.id === product.id);
  const loading = isLoading(product.id);
  const outOfStock = product.stock < 1;

  async function handleBuyNow() {
    if (outOfStock) return;
    setBuyingNow(true);
    try {
      if (!inCart) {
        await addToCart(product);
        const added = useCartStore
          .getState()
          .cartProducts.some((p) => p.id === product.id);
        if (!added) return;
      }
      // Straight to Stripe — the cart page is the only review step.
      await startCheckout();
    } finally {
      setBuyingNow(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <CartErrorBanner />
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            <div className="lg:w-1/2 p-8 bg-gray-100 flex items-center justify-center">
              <div className="relative w-full aspect-square max-w-md">
                <Image
                  src={getImageSrc(product.imageUrl)}
                  alt={product.name}
                  fill
                  className="object-cover rounded-xl"
                  unoptimized
                  priority
                />
              </div>
            </div>

            <div className="lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
              <div className="mb-6">
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                  {product.name}
                </h1>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-blue-600">
                    ${product.price.toFixed(2)}
                  </span>
                  <span className="text-gray-500 text-sm">USD</span>
                </div>
                <p
                  className={`mt-3 text-sm font-medium ${
                    outOfStock
                      ? "text-red-600"
                      : product.stock <= 5
                        ? "text-amber-600"
                        : "text-gray-600"
                  }`}
                >
                  {outOfStock
                    ? "Out of stock"
                    : product.stock <= 5
                      ? `Only ${product.stock} left`
                      : `${product.stock} in stock`}
                </p>
              </div>

              <div className="border-t border-gray-200 pt-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  Description
                </h2>
                <p className="text-gray-700 leading-relaxed text-lg">
                  {product.description}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  onClick={() =>
                    inCart ? removeFromCart(product.id) : addToCart(product)
                  }
                  disabled={loading || (!inCart && outOfStock)}
                  className={`flex-1 font-semibold py-4 px-8 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed
                    ${
                      inCart
                        ? "bg-red-100 text-red-700 hover:bg-red-200"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                >
                  {loading
                    ? "..."
                    : inCart
                      ? "Remove from Cart"
                      : outOfStock
                        ? "Out of Stock"
                        : "Add to Cart"}
                </button>
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={loading || buyingNow || checkoutLoading || outOfStock}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-4 px-8 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {buyingNow || checkoutLoading ? "Processing..." : "Buy Now"}
                </button>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="block font-semibold text-gray-900">
                      Free Shipping
                    </span>
                    <span>On orders over $50</span>
                  </div>
                  <div>
                    <span className="block font-semibold text-gray-900">
                      Easy Returns
                    </span>
                    <span>30-day return policy</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
