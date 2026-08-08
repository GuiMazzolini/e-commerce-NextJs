import Link from "next/link";
import Image from "next/image";
import { connectToDB } from "@/app/api/db";
import { getImageSrc } from "@/app/lib/images";
import { products as productsCollection } from "@/app/lib/db-collections";

const GITHUB_URL = "https://github.com/GuiMazzolini/e-commerce-NextJs";

type HomeProduct = {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
};

const highlights = [
  {
    title: "Guest checkout",
    description: "Buy without an account. Stripe collects email and shipping securely.",
  },
  {
    title: "Inventory-aware",
    description: "Stock is validated in cart and checkout, then decremented after payment.",
  },
  {
    title: "Admin-ready",
    description: "Protected product CRUD so shop owners can manage catalog and stock.",
  },
];

const caseStudyPoints = [
  {
    title: "Server-trusted commerce",
    body: "Prices, stock, and line items are built on the server from MongoDB — never from client cart state alone.",
  },
  {
    title: "Reliable fulfillment",
    body: "Stripe webhooks plus a success-page fallback, unique order IDs, and idempotent inventory updates.",
  },
  {
    title: "Built for real clients",
    body: "Auth, guest carts, order history, confirmation emails, and an admin panel you can extend for each project.",
  },
];

const stack = [
  "Next.js 16",
  "React 19",
  "TypeScript",
  "MongoDB",
  "NextAuth",
  "Stripe",
  "Zustand",
  "Tailwind CSS",
  "Resend",
];

async function getHomeProducts(): Promise<HomeProduct[]> {
  try {
    const { db } = await connectToDB();
    const docs = await productsCollection(db)
      .find({})
      .sort({ name: 1 })
      .limit(8)
      .toArray() as unknown as Array<{
      id: string;
      name: string;
      price: number;
      imageUrl: string;
    }>;

    return docs.map((doc) => ({
      id: doc.id,
      name: doc.name,
      price: doc.price,
      imageUrl: doc.imageUrl,
    }));
  } catch {
    return [];
  }
}

export default async function LandingPage() {
  const products = await getHomeProducts();
  const heroProducts = products.slice(0, 4);
  const featured = products.slice(0, 4);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-stone-200 bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.08),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(15,23,42,0.05),transparent_40%)] pointer-events-none" />

        <div className="relative container mx-auto px-4 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-4 py-1.5 text-sm text-stone-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Full-stack e-commerce portfolio project
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
                  StyleShop
                  <span className="block text-stone-500 text-2xl sm:text-3xl lg:text-4xl font-semibold mt-3">
                    A production-style storefront you can explore end to end
                  </span>
                </h1>
                <p className="text-lg text-stone-600 max-w-xl leading-relaxed">
                  Browse products, manage a cart, checkout as a guest or signed-in
                  user, and receive order confirmation — built to show how I ship
                  real commerce features for freelance clients.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center rounded-xl bg-stone-900 px-6 py-3.5 text-white font-semibold hover:bg-stone-800 transition-colors"
                >
                  Explore the shop
                </Link>
                <Link
                  href="#case-study"
                  className="inline-flex items-center justify-center rounded-xl border border-stone-300 bg-white px-6 py-3.5 font-semibold hover:border-stone-400 transition-colors"
                >
                  View case study
                </Link>
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-xl border border-stone-300 bg-white px-6 py-3.5 font-semibold hover:border-stone-400 transition-colors"
                >
                  GitHub
                </a>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 pt-4">
                {highlights.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
                  >
                    <p className="font-semibold text-stone-900">{item.title}</p>
                    <p className="mt-1 text-sm text-stone-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="rounded-4xl border border-stone-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                {heroProducts.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                      {heroProducts[0] && (
                        <Link
                          href={`/products/${heroProducts[0].id}`}
                          className="relative block aspect-square rounded-2xl overflow-hidden bg-stone-100"
                        >
                          <Image
                            src={getImageSrc(heroProducts[0].imageUrl)}
                            alt={heroProducts[0].name}
                            fill
                            unoptimized
                            className="object-cover"
                            sizes="(max-width: 1024px) 50vw, 25vw"
                            priority
                          />
                        </Link>
                      )}
                      {heroProducts[1] && (
                        <Link
                          href={`/products/${heroProducts[1].id}`}
                          className="relative block aspect-4/3 rounded-2xl overflow-hidden bg-stone-100"
                        >
                          <Image
                            src={getImageSrc(heroProducts[1].imageUrl)}
                            alt={heroProducts[1].name}
                            fill
                            unoptimized
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
                          className="relative block aspect-4/3 rounded-2xl overflow-hidden bg-stone-100"
                        >
                          <Image
                            src={getImageSrc(heroProducts[2].imageUrl)}
                            alt={heroProducts[2].name}
                            fill
                            unoptimized
                            className="object-cover"
                            sizes="(max-width: 1024px) 50vw, 25vw"
                          />
                        </Link>
                      )}
                      {heroProducts[3] && (
                        <Link
                          href={`/products/${heroProducts[3].id}`}
                          className="relative block aspect-square rounded-2xl overflow-hidden bg-stone-100"
                        >
                          <Image
                            src={getImageSrc(heroProducts[3].imageUrl)}
                            alt={heroProducts[3].name}
                            fill
                            unoptimized
                            className="object-cover"
                            sizes="(max-width: 1024px) 50vw, 25vw"
                          />
                        </Link>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="aspect-square rounded-2xl bg-stone-100 flex items-center justify-center text-center p-8 text-stone-500">
                    Seed products to preview the live catalog collage.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Case study */}
      <section id="case-study" className="scroll-mt-20 py-20 bg-stone-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mb-12">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700 mb-3">
              Case study
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Built like a client project, not a toy demo
            </h2>
            <p className="text-lg text-stone-600 leading-relaxed">
              StyleShop demonstrates the full purchase journey — catalog, cart,
              authentication, payments, inventory, admin, and post-purchase email —
              with the kind of guardrails you want before going live.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-12">
            {caseStudyPoints.map((point) => (
              <div
                key={point.title}
                className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
              >
                <h3 className="text-xl font-semibold mb-3">{point.title}</h3>
                <p className="text-stone-600 leading-relaxed">{point.body}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
            <h3 className="text-lg font-semibold mb-4">Stack</h3>
            <div className="flex flex-wrap gap-2">
              {stack.map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-stone-100 px-3 py-1.5 text-sm font-medium text-stone-700"
                >
                  {item}
                </span>
              ))}
            </div>
            <p className="mt-6 text-sm text-stone-500 leading-relaxed">
              Payments run through Stripe test mode in this demo. Order confirmation
              emails are sent via Resend when configured.
            </p>
          </div>
        </div>
      </section>

      {/* Featured products */}
      {featured.length > 0 && (
        <section id="featured" className="scroll-mt-20 py-20 bg-white border-y border-stone-200">
          <div className="container mx-auto px-4">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Live catalog</h2>
                <p className="mt-2 text-stone-600">
                  Products loaded from MongoDB — same data used across shop and admin.
                </p>
              </div>
              <Link
                href="/products"
                className="font-semibold text-blue-700 hover:text-blue-800"
              >
                View all products →
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="group overflow-hidden rounded-2xl border border-stone-200 bg-white hover:shadow-lg transition-all"
                >
                  <div className="relative aspect-square bg-stone-100">
                    <Image
                      src={getImageSrc(product.imageUrl)}
                      alt={product.name}
                      fill
                      unoptimized
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-stone-900">{product.name}</h3>
                    <p className="mt-1 text-stone-600">${product.price.toFixed(2)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 bg-stone-900 text-white">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Want a storefront like this for your business?
          </h2>
          <p className="text-lg text-stone-300 mb-8 leading-relaxed">
            This project is a working reference for how I approach e-commerce:
            polished UX, secure checkout, and maintainable admin workflows.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/products"
              className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3.5 font-semibold text-stone-900 hover:bg-stone-100 transition-colors"
            >
              Try the demo shop
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-xl border border-stone-600 px-6 py-3.5 font-semibold hover:bg-stone-800 transition-colors"
            >
              Inspect the code
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
