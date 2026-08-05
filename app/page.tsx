import Link from "next/link";
import Image from "next/image";
import { connectToDB } from "@/app/api/db";

type HomeProduct = {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
};

async function getHomeProducts(): Promise<HomeProduct[]> {
  try {
    const { db } = await connectToDB();
    const docs = await db
      .collection("products")
      .find({})
      .sort({ name: 1 })
      .limit(8)
      .toArray();

    return docs.map(
      (doc: {
        id: string;
        name: string;
        price: number;
        imageUrl: string;
      }) => ({
        id: doc.id,
        name: doc.name,
        price: doc.price,
        imageUrl: doc.imageUrl,
      })
    );
  } catch {
    return [];
  }
}

function productImageSrc(imageUrl: string) {
  return imageUrl.startsWith("http") ? imageUrl : `/${imageUrl}`;
}

export default async function LandingPage() {
  const products = await getHomeProducts();
  const heroProducts = products.slice(0, 4);
  const featured = products.slice(0, 4);

  return (
    <div className="min-h-screen bg-linear-to-b from-blue-50 to-white">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-r from-blue-600 to-purple-600 opacity-10 pointer-events-none"></div>

        <div className="relative z-10 container mx-auto px-4 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left space-y-8">
              <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 leading-tight">
                Discover Your
                <span className="block text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600">
                  Perfect Style
                </span>
              </h1>

              <p className="text-xl text-gray-600 max-w-xl">
                Explore our curated collection of premium products designed to
                elevate your everyday life. Quality meets affordability.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/products"
                  className="group px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
                >
                  Shop Now
                  <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </Link>

                <Link
                  href="#featured"
                  className="px-8 py-4 bg-white text-gray-900 rounded-lg font-semibold text-lg border-2 border-gray-200 hover:border-blue-600 transition-all"
                >
                  View Collection
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-8 pt-8 border-t border-gray-200">
                <div>
                  <div className="text-2xl font-bold text-gray-900">Secure</div>
                  <div className="text-sm text-gray-600">Stripe Checkout</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">OAuth</div>
                  <div className="text-sm text-gray-600">GitHub &amp; Google</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">Free</div>
                  <div className="text-sm text-gray-600">Shipping over $50</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 bg-linear-to-r from-blue-600 to-purple-600 rounded-3xl opacity-20 blur-2xl pointer-events-none"></div>
              <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden p-8">
                {heroProducts.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                      {heroProducts[0] && (
                        <Link
                          href={`/products/${heroProducts[0].id}`}
                          className="relative block aspect-square rounded-2xl overflow-hidden bg-gray-100"
                        >
                          <Image
                            src={productImageSrc(heroProducts[0].imageUrl)}
                            alt={heroProducts[0].name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 1024px) 50vw, 25vw"
                            priority
                          />
                        </Link>
                      )}
                      {heroProducts[1] && (
                        <Link
                          href={`/products/${heroProducts[1].id}`}
                          className="relative block aspect-4/3 rounded-2xl overflow-hidden bg-gray-100"
                        >
                          <Image
                            src={productImageSrc(heroProducts[1].imageUrl)}
                            alt={heroProducts[1].name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 1024px) 50vw, 25vw"
                          />
                        </Link>
                      )}
                    </div>
                    <div className="space-y-4 pt-8">
                      {heroProducts[2] && (
                        <Link
                          href={`/products/${heroProducts[2].id}`}
                          className="relative block aspect-4/3 rounded-2xl overflow-hidden bg-gray-100"
                        >
                          <Image
                            src={productImageSrc(heroProducts[2].imageUrl)}
                            alt={heroProducts[2].name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 1024px) 50vw, 25vw"
                          />
                        </Link>
                      )}
                      {heroProducts[3] && (
                        <Link
                          href={`/products/${heroProducts[3].id}`}
                          className="relative block aspect-square rounded-2xl overflow-hidden bg-gray-100"
                        >
                          <Image
                            src={productImageSrc(heroProducts[3].imageUrl)}
                            alt={heroProducts[3].name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 1024px) 50vw, 25vw"
                          />
                        </Link>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="aspect-square rounded-2xl bg-gray-100 flex items-center justify-center text-gray-500 text-center p-6">
                    <div>
                      <p className="font-semibold text-gray-700 mb-2">
                        No products yet
                      </p>
                      <Link href="/products" className="text-blue-600 hover:underline">
                        Browse the shop
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Shop With Us</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We&apos;re committed to providing the best shopping experience
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-2xl hover:bg-gray-50 transition-colors">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Premium Quality</h3>
              <p className="text-gray-600">
                Carefully curated products that meet our high standards for quality and durability
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl hover:bg-gray-50 transition-colors">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Best Prices</h3>
              <p className="text-gray-600">
                Competitive pricing with regular deals and promotions to save you money
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl hover:bg-gray-50 transition-colors">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Fast Shipping</h3>
              <p className="text-gray-600">
                Free shipping on orders over $50 with quick delivery to your doorstep
              </p>
            </div>
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section id="featured" className="scroll-mt-20 py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Featured Products</h2>
              <p className="text-xl text-gray-600">A peek at what&apos;s in the shop</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="group relative overflow-hidden rounded-2xl aspect-square bg-gray-200 hover:shadow-xl transition-all hover:-translate-y-2"
                >
                  <Image
                    src={productImageSrc(product.imageUrl)}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent pointer-events-none"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-6 pointer-events-none">
                    <h3 className="text-2xl font-bold text-white mb-2">{product.name}</h3>
                    <p className="text-white/80 text-sm group-hover:translate-x-2 transition-transform">
                      ${product.price.toFixed(2)} →
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-20 bg-linear-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Start Shopping?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of happy customers and find your perfect products today
          </p>
          <Link
            href="/products"
            className="inline-block px-10 py-5 bg-white text-blue-600 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
          >
            Browse All Products
          </Link>
        </div>
      </section>

      <section className="py-16 bg-white border-t border-gray-200">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600">
            Secure payments powered by{" "}
            <span className="font-semibold text-gray-900">Stripe</span>
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Cards are processed in test mode for this demo.
          </p>
        </div>
      </section>
    </div>
  );
}
