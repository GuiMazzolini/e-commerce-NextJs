import { connectToDB } from "@/app/api/db";
import { authOptions } from "@/app/lib/auth";
import { carts, products, users } from "@/app/lib/db-collections";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { getAppUrl, getStripe } from "@/app/lib/stripe";
import { getShippingCost } from "@/app/lib/shipping";
import {
  encodeCartItemsMetadata,
  STRIPE_METADATA_VALUE_LIMIT,
} from "@/app/lib/cart-metadata";
import { MAX_CART_LINE_ITEMS } from "@/app/lib/schemas";
import { enforceRateLimit, RATE_LIMITS } from "@/app/lib/rate-limit";
import {
  attachQuantitiesToProducts,
  getCartStockError,
  parseGuestCheckoutItems,
  type CartItem,
} from "@/app/lib/checkout-cart";

export async function POST(req: NextRequest) {
  const limited = await enforceRateLimit(
    req,
    "checkout",
    RATE_LIMITS.checkout.limit,
    RATE_LIMITS.checkout.windowSec
  );
  if (limited) return limited;

  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;

  const { db } = await connectToDB();

  // Present only once a signed-in user has saved an address.
  let stripeCustomerId: string | undefined;

  let items: CartItem[] = [];
  if (email) {
    const [cart, user] = await Promise.all([
      carts(db).findOne({ userId: email }),
      users(db).findOne({ email }),
    ]);
    items = cart?.items || [];
    stripeCustomerId = user?.stripeCustomerId;
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

  // A saved cart is not validated on read, so it can exceed the cap even
  // though the guest payload schema enforces it.
  if (items.length > MAX_CART_LINE_ITEMS) {
    return NextResponse.json(
      { error: `A cart can hold at most ${MAX_CART_LINE_ITEMS} different products` },
      { status: 400 }
    );
  }

  const productIds = items.map((i) => i.productId);
  const productDocs = await products(db)
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

  // Stripe rejects metadata values over 500 chars. Fulfillment decrements stock
  // from this string, so silently truncating it would leave inventory wrong.
  if (cartItemsMeta.length > STRIPE_METADATA_VALUE_LIMIT) {
    return NextResponse.json(
      { error: "Cart is too large to check out. Please remove some items." },
      { status: 400 }
    );
  }

  let checkoutSession;
  try {
    checkoutSession = await stripe.checkout.sessions.create({
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
      // Cancelling returns to the cart, which is now the only review step.
      cancel_url: `${origin}/cart`,
      ...(email
        ? {
            client_reference_id: email,
            // A Customer carries the saved shipping address, so Checkout
            // prefills it. Stripe rejects `customer` and `customer_email`
            // together, so only one is ever sent.
            ...(stripeCustomerId
              ? { customer: stripeCustomerId }
              : { customer_email: email }),
            metadata: { userId: email, cartItems: cartItemsMeta },
          }
        : {
            metadata: { isGuest: "true", cartItems: cartItemsMeta },
          }),
    });
  } catch (err) {
    console.error("Stripe checkout session creation failed:", err);
    return NextResponse.json(
      { error: "Payment provider is unavailable. Please try again." },
      { status: 502 }
    );
  }

  if (!checkoutSession.url) {
    return NextResponse.json({ error: "Could not create checkout session" }, { status: 500 });
  }

  return NextResponse.json({ url: checkoutSession.url });
}
