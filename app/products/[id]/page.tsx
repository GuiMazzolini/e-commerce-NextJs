"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "@/app/lib/store/cartStore";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import NotFoundPage from "@/app/not-found";

type Product = {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
};

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);

  const { cartProducts, addToCart, removeFromCart, fetchCart, isLoading } = useCartStore();
  const inCart = cartProducts.some((p) => p.id === id);
  const loading = isLoading(id);

  async function handleBuyNow() {
    if (!product) return;
    setBuyingNow(true);
    try {
      if (!inCart) {
        await addToCart(product.id);
      }
      router.push("/checkout");
    } finally {
      setBuyingNow(false);
    }
  }

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((res) => {
        if (!res.ok) { setNotFound(true); return null; }
        return res.json();
      })
      .then((data) => data && setProduct(data));

    fetchCart();
  }, [id]);

  if (notFound) return <NotFoundPage />;
  if (!product) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-500 text-xl">Loading...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {/* Image Section */}
            <div className="lg:w-1/2 p-8 bg-gray-100 flex items-center justify-center">
              <div className="relative w-full aspect-square max-w-md">
                <Image
                  src={'/' + product.imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover rounded-xl"
                />
              </div>
            </div>

            {/* Content Section */}
            <div className="lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
              <div className="mb-6">
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                  {product.name}
                </h1>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-blue-600">
                    ${product.price}
                  </span>
                  <span className="text-gray-500 text-sm">USD</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  Description
                </h2>
                <p className="text-gray-700 leading-relaxed text-lg">
                  {product.description}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => inCart ? removeFromCart(product.id) : addToCart(product.id)}
                  disabled={loading}
                  className={`flex-1 font-semibold py-4 px-8 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed
                    ${inCart
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                >
                  {loading ? '...' : inCart ? 'Remove from Cart' : 'Add to Cart'}
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={loading || buyingNow}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-4 px-8 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {buyingNow ? "Processing..." : "Buy Now"}
                </button>
              </div>

              {/* Additional Info */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="block font-semibold text-gray-900">Free Shipping</span>
                    <span>On orders over $50</span>
                  </div>
                  <div>
                    <span className="block font-semibold text-gray-900">Easy Returns</span>
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