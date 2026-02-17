"use client";

import { updateCartQuantity, removeCartItem } from "../lib/api/cart";
import { useState, useMemo } from "react";
import { Product } from "../product-data";
import Link from "next/link";
import CartItem from "../components/CartItem";

export default function ShoppingCartList({ initialCartProducts }: { initialCartProducts: Product[] }) {
  const [cartProducts, setCartProducts] = useState(initialCartProducts);
  const [loadingProducts, setLoadingProducts] = useState<Set<string>>(new Set());

  function startLoading(productId: string) {
    setLoadingProducts(prev => new Set(prev).add(productId));
  };

  function stopLoading(productId: string) {
    setLoadingProducts(prev => {
      const newSet = new Set(prev);
      newSet.delete(productId);
      return newSet;
    });
  };

  async function updateQuantity(productId: string, newQuantity: number) {
    if (newQuantity < 1) return;
    startLoading(productId);
    
    try {
      const updatedCartProducts = await updateCartQuantity(productId, newQuantity);
      setCartProducts(updatedCartProducts);
    } catch (error) {
      console.error("Error updating quantity:", error);
      alert("Failed to update quantity. Please try again.");
    } finally {
      stopLoading(productId);
    };
  };

  async function removeFromCart(productId: string) {
    startLoading(productId);
  
    try {
      const updatedCartProducts = await removeCartItem(productId);
      setCartProducts(updatedCartProducts);
    } catch (error) {
      console.error("Error removing from cart:", error);
      alert("Failed to remove item. Please try again.");
    } finally {
      stopLoading(productId);
    };
  };

  function isLoading(productId: string) {
    return loadingProducts.has(productId);
  };

  const subtotal = useMemo(() => {
  return cartProducts.reduce(
    (sum, product) => sum + product.price * (product.quantity || 1),
    0
    );
  }, [cartProducts]);

  if (cartProducts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="mb-6">
              <svg className="mx-auto h-24 w-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">Looks like you haven't added any items yet.</p>
            <Link href="/products" className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Shopping Cart</h1>
        
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cartProducts.map((product) => (
              <CartItem
                key={product.id}
                product={product}
                loading={isLoading(product.id)}
                onUpdateQuantity={updateQuantity}
                onRemove={removeFromCart}
              />
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({cartProducts.reduce((sum, p) => sum + (p.quantity || 1), 0)} items)</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="text-green-600 font-semibold">FREE</span>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-xl font-bold text-gray-900">
                    <span>Total</span>
                    <span className="text-blue-600">${subtotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <button className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg mb-4">
                Proceed to Checkout
              </button>

              <Link href="/products" className="block w-full text-center bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors">
                Continue Shopping
              </Link>

              <div className="mt-6 pt-6 border-t border-gray-200 space-y-3 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Free shipping on orders over $50</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>30-day easy returns</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Secure checkout</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}