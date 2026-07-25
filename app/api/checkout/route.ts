import { connectToDB } from "@/app/api/db";
import { authOptions } from "@/app/lib/auth";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
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

function parseGuestItems(body: unknown): CartItem[] | null {
  if (!body || typeof body !== "object" || !("items" in body)) return null;
  const items = (body as { items: unknown }).items;
  if (!Array.isArray(items) || items.length === 0) return null;

  const parsed: CartItem[] = [];
  for (const item of items) {
    if (!item || typeof item !== "object") return null;
    const { productId, quantity } = item as Record<string, unknown>;
    if (typeof productId !== "string" || !productId) return null;
    if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1) {
      return null;
    }
    parsed.push({ productId, quantity: Math.min(quantity, 99) });
  }
  return parsed;
}

async function buildCartProducts(
  db: Awaited<ReturnType<typeof connectToDB>>["db"],
  items: CartItem[]
) {
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

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;

  const { db } = await connectToDB();

  let items: CartItem[] = [];
  if (email) {
    const cart = await db.collection("carts").findOne({ userId: email });
    items = cart?.items || [];
  } else {
    let body: unknown = null;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const guestItems = parseGuestItems(body);
    if (!guestItems) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }
    items = guestItems;
  }

  const cartProducts = await buildCartProducts(db, items);

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
    ...(email
      ? {
          client_reference_id: email,
          customer_email: email,
          metadata: { userId: email },
        }
      : {
          // Stripe collects email; fulfillment uses customer_details.email
          metadata: { isGuest: "true" },
        }),
  });

  if (!checkoutSession.url) {
    return NextResponse.json({ error: "Could not create checkout session" }, { status: 500 });
  }

  return NextResponse.json({ url: checkoutSession.url });
}
