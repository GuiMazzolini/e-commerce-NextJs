'use client';

import { Product } from '../product-data';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '../lib/store/cartStore';
import CartErrorBanner from './CartErrorBanner';

export default function ProductsList({ products }: { products: Product[] }) {
  const { cartProducts, addToCart, updateQuantity, isLoading } = useCartStore();

  function cartEntry(productId: string) {
    return cartProducts.find((cp) => cp.id === productId);
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Our Products</h1>

        <CartErrorBanner />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => {
            const entry = cartEntry(product.id);
            const inCart = !!entry;
            const quantity = entry?.quantity || 0;
            const loading = isLoading(product.id);

            return (
              <div key={product.id} className="group">
                <Link href={`/products/${product.id}`}>
                  <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <div className="relative w-full aspect-square bg-gray-100">
                      <Image
                        src={`/${product.imageUrl}`}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    <div className="p-4">
                      <h2 className="text-lg font-semibold mb-2 group-hover:text-blue-600 transition-colors">
                        {product.name}
                      </h2>

                      <span className="text-2xl font-bold text-blue-600">
                        ${product.price}
                      </span>
                    </div>
                  </div>
                </Link>

                {inCart ? (
                  <div className="mt-3 flex items-center justify-between border border-gray-300 rounded-lg overflow-hidden">
                    <button
                      onClick={() => updateQuantity(product.id, quantity - 1)}
                      disabled={loading}
                      aria-label={quantity <= 1 ? 'Remove from cart' : 'Decrease quantity'}
                      className="px-4 py-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                      {quantity <= 1 ? (
                        <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      ) : (
                        '−'
                      )}
                    </button>

                    <span className="font-semibold min-w-8 text-center">
                      {loading ? '...' : quantity}
                    </span>

                    <button
                      onClick={() => updateQuantity(product.id, quantity + 1)}
                      disabled={loading}
                      aria-label="Increase quantity"
                      className="px-4 py-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => addToCart(product)}
                    disabled={loading}
                    className={`
                      w-full mt-3 py-2 rounded-lg font-semibold
                      transition-all duration-200
                      bg-blue-600 text-white hover:bg-blue-700
                      ${loading && 'opacity-50 cursor-not-allowed'}
                    `}
                  >
                    {loading ? 'Adding...' : 'Add to Cart'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
