import { connectToDB } from "@/app/api/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { getAppUrl, getStripe } from "@/app/lib/stripe";
import { getShippingCost } from "@/app/lib/shipping";

type CartItem = { productId: string; quantity: number };
type DBProduct = {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
};

async function buildCartProducts(db: Awaited<ReturnType<typeof connectToDB>>["db"], items: CartItem[]) {
  if (!items.length) return [];
  const productIds = items.map((i) => i.productId);
  const productDocs = await db
    .collection("products")
    .find({ id: { $in: productIds } })
    .toArray();

  return items
    .map((item) => {
      const product = productDocs.find((p: DBProduct) => p.id === item.productId);
      return product ? { ...product, quantity: item.quantity } : null;
    })
    .filter(Boolean) as (DBProduct & { quantity: number })[];
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { db } = await connectToDB();
  const cart = await db.collection("carts").findOne({ userId: session.user.email });
  const cartProducts = await buildCartProducts(db, cart?.items || []);

  if (cartProducts.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const origin = getAppUrl();
  const stripe = getStripe();

  const line_items = cartProducts.map((p) => {
    const image =
      p.imageUrl && !p.imageUrl.startsWith("http")
        ? [`${origin}/${p.imageUrl.replace(/^\//, "")}`]
        : p.imageUrl
          ? [p.imageUrl]
          : undefined;

    return {
      quantity: p.quantity,
      price_data: {
        currency: "usd",
        unit_amount: Math.round(p.price * 100),
        product_data: {
          name: p.name,
          ...(image ? { images: image } : {}),
        },
      },
    };
  });

  const subtotal = cartProducts.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const shippingCost = getShippingCost(subtotal);

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items,
    shipping_address_collection: {
      allowed_countries: ["US", "CA", "GB", "BR", "PT", "DE", "FR", "ES", "IT", "NL"],
    },
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          display_name: shippingCost === 0 ? "Free shipping" : "Standard shipping",
          fixed_amount: {
            amount: Math.round(shippingCost * 100),
            currency: "usd",
          },
        },
      },
    ],
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/checkout`,
    client_reference_id: session.user.email,
    customer_email: session.user.email,
    metadata: {
      userId: session.user.email,
    },
  });

  if (!checkoutSession.url) {
    return NextResponse.json({ error: "Could not create checkout session" }, { status: 500 });
  }

  return NextResponse.json({ url: checkoutSession.url });
}
