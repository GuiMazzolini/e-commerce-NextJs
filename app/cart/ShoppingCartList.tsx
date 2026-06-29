"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { Product } from "../product-data";
import Link from "next/link";
import CartItem from "../components/CartItem";
import CartErrorBanner from "../components/CartErrorBanner";
import { useCartStore } from "../lib/store/cartStore";
import {
  FREE_SHIPPING_THRESHOLD,
  getOrderTotal,
  getShippingCost,
} from "../lib/shipping";

export default function ShoppingCartList({ initialCartProducts }: { initialCartProducts: Product[] }) {
  const { status } = useSession();
  const isGuest = status === "unauthenticated";

  const cartProducts = useCartStore((s) => s.cartProducts);
  const subtotal = useCartStore((s) => s.getSubtotal());
  const totalItems = useCartStore((s) => s.getTotalItems());
  const setCart = useCartStore((s) => s.setCart);

  const shipping = getShippingCost(subtotal);
  const total = getOrderTotal(subtotal);
  const remainingForFreeShipping = FREE_SHIPPING_THRESHOLD - subtotal;

  useEffect(() => {
    if (initialCartProducts.length > 0) {
      setCart(initialCartProducts);
    }
  }, []);

  if (cartProducts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Your cart is empty
            </h2>
            <p className="text-gray-600 mb-8">
              Looks like you haven't added any items yet.
            </p>
            <Link
              href="/products"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        <CartErrorBanner />

        {isGuest && (
          <p className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            You&apos;re shopping as a guest.{" "}
            <Link
              href="/api/auth/signin?callbackUrl=/cart"
              className="font-semibold underline hover:text-amber-900"
            >
              Sign in
            </Link>{" "}
            to save your cart across devices and complete checkout.
          </p>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cartProducts.map((product) => (
              <CartItem key={product.id} product={product} />
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>

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

                {remainingForFreeShipping > 0 && (
                  <p className="text-sm text-gray-500">
                    Add ${remainingForFreeShipping.toFixed(2)} more for free shipping.
                  </p>
                )}

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-xl font-bold text-gray-900">
                    <span>Total</span>
                    <span className="text-blue-600">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <Link
                href={isGuest ? "/api/auth/signin?callbackUrl=/checkout" : "/checkout"}
                className="block text-center w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg mb-4"
              >
                {isGuest ? "Sign in to Checkout" : "Proceed to Checkout"}
              </Link>

              <Link
                href="/products"
                className="block w-full text-center bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}