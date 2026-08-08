import { connectToDB } from "@/app/api/db";
import { authOptions } from "@/app/lib/auth";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { getAppUrl, getStripe } from "@/app/lib/stripe";
import { getShippingCost } from "@/app/lib/shipping";
import { encodeCartItemsMetadata } from "@/app/lib/cart-metadata";
import {
  attachQuantitiesToProducts,
  getCartStockError,
  parseGuestCheckoutItems,
  type CartItem,
} from "@/app/lib/checkout-cart";

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
    const guestItems = parseGuestCheckoutItems(body);
    if (!guestItems) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }
    items = guestItems;
  }

  if (!items.length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const productIds = items.map((i) => i.productId);
  const productDocs = await db
    .collection("products")
    .find({ id: { $in: productIds } })
    .toArray();

  const stockError = getCartStockError(items, productDocs);
  if (stockError) {
    return NextResponse.json({ error: stockError }, { status: 409 });
  }

  const cartProducts = attachQuantitiesToProducts(items, productDocs);

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
  const cartItemsMeta = encodeCartItemsMetadata(
    cartProducts.map((p) => ({ productId: p.id, quantity: p.quantity }))
  );

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
          metadata: { userId: email, cartItems: cartItemsMeta },
        }
      : {
          metadata: { isGuest: "true", cartItems: cartItemsMeta },
        }),
  });

  if (!checkoutSession.url) {
    return NextResponse.json({ error: "Could not create checkout session" }, { status: 500 });
  }

  return NextResponse.json({ url: checkoutSession.url });
}
