"use client"

import { Product } from "./product-data";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const USER_ID = "2"; // TODO: Get from auth context

export default function ProductsList({ 
  products, 
  initialCartProducts 
}: { 
  products: Product[], 
  initialCartProducts: Product[] 
}) {
  const [cartProducts, setCartProducts] = useState(initialCartProducts);
  const [loadingProducts, setLoadingProducts] = useState<Set<string>>(new Set());

  async function addToCart(productId: string) {
    setLoadingProducts(prev => new Set(prev).add(productId));
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${USER_ID}/cart/`, {
        method: "POST",
        body: JSON.stringify({ productId }),
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to add to cart: ${response.statusText}`);
      }

      const updatedCartProducts = await response.json();
      setCartProducts(updatedCartProducts);
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("Failed to add item to cart. Please try again.");
    } finally {
      setLoadingProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  }

  async function removeFromCart(productId: string) {
    setLoadingProducts(prev => new Set(prev).add(productId));
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${USER_ID}/cart/`, {
        method: "DELETE",
        body: JSON.stringify({ productId }),
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to remove from cart: ${response.statusText}`);
      }

      const updatedCartProducts = await response.json();
      setCartProducts(updatedCartProducts);
    } catch (error) {
      console.error("Error removing from cart:", error);
      alert("Failed to remove item from cart. Please try again.");
    } finally {
      setLoadingProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  }

  function productIsInCart(productId: string) {
    return cartProducts.some(cp => cp.id === productId);
  }

  function isLoading(productId: string) {
    return loadingProducts.has(productId);
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Our Products</h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map(product => {
            const inCart = productIsInCart(product.id);
            const loading = isLoading(product.id);

            return (
              <div key={product.id} className="group">
                <Link href={`/products/${product.id}`}>
                  <div className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    {/* Image Container */}
                    <div className="relative w-full aspect-square bg-gray-100">
                      <Image 
                        src={`/${product.imageUrl}`}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    
                    {/* Content */}
                    <div className="p-4">
                      <h2 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {product.name}
                      </h2>
                      <div className="flex items-baseline gap-1 mb-4">
                        <span className="text-2xl font-bold text-blue-600">
                          ${product.price}
                        </span>
                        <span className="text-xs text-gray-500">USD</span>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Cart Button - Outside Link */}
                <button
                  onClick={() => inCart ? removeFromCart(product.id) : addToCart(product.id)}
                  disabled={loading}
                  className={`
                    w-full mt-3 py-2 px-4 rounded-lg font-semibold transition-all duration-200
                    ${inCart 
                      ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                    }
                    ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}
                  `}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {inCart ? 'Removing...' : 'Adding...'}
                    </span>
                  ) : (
                    inCart ? 'Remove from Cart' : 'Add to Cart'
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}