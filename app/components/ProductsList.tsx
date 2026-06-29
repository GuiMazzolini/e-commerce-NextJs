'use client';

import { Product } from '../product-data';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '../lib/store/cartStore';

export default function ProductsList({ products }: { products: Product[] }) {
  const { cartProducts, addToCart, removeFromCart, isLoading } = useCartStore();

  function productIsInCart(productId: string) {
    return cartProducts.some((cp) => cp.id === productId);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Our Products</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => {
            const inCart = productIsInCart(product.id);
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

                <button
                  onClick={() =>
                    inCart
                      ? removeFromCart(product.id)
                      : addToCart(product)
                  }
                  disabled={loading}
                  className={`
                    w-full mt-3 py-2 rounded-lg font-semibold
                    transition-all duration-200
                    ${
                      inCart
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }
                    ${loading && 'opacity-50 cursor-not-allowed'}
                  `}
                >
                  {loading
                    ? inCart
                      ? 'Removing...'
                      : 'Adding...'
                    : inCart
                      ? 'Remove from Cart'
                      : 'Add to Cart'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
