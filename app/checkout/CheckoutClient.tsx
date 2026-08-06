"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getImageSrc } from "@/app/lib/images";
import type { Product } from "@/app/product-data";
import { getOrderTotal, getShippingCost } from "@/app/lib/shipping";
import { useCartStore } from "@/app/lib/store/cartStore";

type CheckoutClientProps = {
  initialCartProducts: Product[];
  isGuest?: boolean;
};

export default function CheckoutClient({
  initialCartProducts,
  isGuest = false,
}: CheckoutClientProps) {
  const router = useRouter();
  const storeCart = useCartStore((s) => s.cartProducts);
  const [hydrated, setHydrated] = useState(!isGuest);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const cartProducts = isGuest ? storeCart : initialCartProducts;

  useEffect(() => {
    if (isGuest && hydrated && cartProducts.length === 0) {
      router.replace("/cart");
    }
  }, [isGuest, hydrated, cartProducts.length, router]);

  const subtotal = cartProducts.reduce(
    (sum, p) => sum + p.price * (p.quantity || 1),
    0
  );
  const totalItems = cartProducts.reduce((sum, p) => sum + (p.quantity || 1), 0);
  const shipping = getShippingCost(subtotal);
  const total = getOrderTotal(subtotal);

  async function startCheckout() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        credentials: "include",
        headers: isGuest ? { "Content-Type": "application/json" } : undefined,
        body: isGuest
          ? JSON.stringify({
              items: cartProducts.map((p) => ({
                productId: p.id,
                quantity: p.quantity || 1,
              })),
            })
          : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Checkout failed");
        return;
      }
      if (data.url && typeof data.url === "string") {
        window.location.href = data.url;
        return;
      }
      setError("No checkout URL returned");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (isGuest && !hydrated) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <p className="text-gray-600">Loading checkout…</p>
        </div>
      </div>
    );
  }

  if (cartProducts.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Checkout</h1>
        <p className="text-gray-600 mb-8">
          Review your order, then continue to secure payment with Stripe.
          {isGuest && " You can pay as a guest — Stripe will collect your email."}
        </p>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cartProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl shadow-md p-4 flex gap-4 items-center"
              >
                <div className="relative w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={getImageSrc(product.imageUrl)}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-gray-900 truncate">{product.name}</h2>
                  <p className="text-gray-600 text-sm">
                    Qty {product.quantity ?? 1} × ${product.price.toFixed(2)}
                  </p>
                </div>
                <p className="font-semibold text-gray-900">
                  ${(product.price * (product.quantity || 1)).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Order summary</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({totalItems} items)</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  {shipping === 0 ? (
                    <span className="text-green-600 font-semibold">FREE</span>
                  ) : (
                    <span>${shipping.toFixed(2)}</span>
                  )}
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-xl font-bold text-gray-900">
                    <span>Total</span>
                    <span className="text-blue-600">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {error && (
                <p className="text-red-600 text-sm mb-4" role="alert">
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={startCheckout}
                disabled={loading}
                className="block text-center w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg mb-4 disabled:opacity-60 disabled:pointer-events-none"
              >
                {loading ? "Redirecting…" : "Pay with Stripe"}
              </button>

              <Link
                href="/cart"
                className="block w-full text-center bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Back to cart
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
