import { connectToDB } from "@/app/api/db";
import { getStripe } from "@/app/lib/stripe";
import { decodeCartItemsMetadata } from "@/app/lib/cart-metadata";
import type Stripe from "stripe";

export type OrderItem = {
  name: string;
  quantity: number;
  unitAmount: number;
};

export type ShippingAddress = {
  name: string | null;
  line1: string | null;
  line2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
};

export type Order = {
  stripeSessionId: string;
  userId: string;
  customerEmail: string | null;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  currency: string;
  shippingAddress: ShippingAddress | null;
  status: "paid";
  createdAt: Date;
};

function centsToDollars(cents: number | null | undefined): number {
  return (cents ?? 0) / 100;
}

function isDuplicateKeyError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: number }).code === 11000
  );
}

export function buildOrderFromStripeSession(
  session: Stripe.Checkout.Session,
  userId: string
): Order {
  const items: OrderItem[] =
    session.line_items?.data.map((item) => ({
      name: item.description ?? "Item",
      quantity: item.quantity ?? 1,
      unitAmount: centsToDollars(item.price?.unit_amount),
    })) ?? [];

  const shippingDetails = session.collected_information?.shipping_details;
  const shipping = shippingDetails?.address;

  return {
    stripeSessionId: session.id,
    userId,
    customerEmail: session.customer_details?.email ?? session.customer_email ?? null,
    items,
    subtotal: centsToDollars(session.amount_subtotal),
    shippingCost: centsToDollars(session.total_details?.amount_shipping),
    total: centsToDollars(session.amount_total),
    currency: session.currency ?? "usd",
    shippingAddress: shipping
      ? {
          name: shippingDetails?.name ?? null,
          line1: shipping.line1 ?? null,
          line2: shipping.line2 ?? null,
          city: shipping.city ?? null,
          state: shipping.state ?? null,
          postalCode: shipping.postal_code ?? null,
          country: shipping.country ?? null,
        }
      : null,
    status: "paid",
    createdAt: new Date(),
  };
}

async function decrementStockForSession(
  db: Awaited<ReturnType<typeof connectToDB>>["db"],
  session: Stripe.Checkout.Session
) {
  const cartItems = decodeCartItemsMetadata(session.metadata?.cartItems);
  for (const item of cartItems) {
    const result = await db.collection("products").updateOne(
      { id: item.productId, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } }
    );
    // If stock raced to zero after payment, keep the paid order; stock just won't go negative.
    if (result.modifiedCount === 0) {
      console.warn(
        `Stock decrement skipped for ${item.productId} x${item.quantity} (session ${session.id})`
      );
    }
  }
}

/**
 * Idempotently fulfills a paid Checkout Session: saves the order (once),
 * decrements stock (once), and empties the user's cart.
 */
export async function fulfillCheckoutSession(
  sessionId: string
): Promise<{ paid: boolean; fulfilled: boolean }> {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["line_items"],
  });

  if (session.payment_status !== "paid") {
    return { paid: false, fulfilled: false };
  }

  const userId =
    session.client_reference_id ||
    session.metadata?.userId ||
    session.customer_details?.email ||
    session.customer_email;

  if (!userId || typeof userId !== "string") {
    return { paid: true, fulfilled: false };
  }

  const { db } = await connectToDB();
  const order = buildOrderFromStripeSession(session, userId);

  let inserted = false;
  try {
    await db.collection("orders").insertOne(order);
    inserted = true;
  } catch (err) {
    if (!isDuplicateKeyError(err)) throw err;
  }

  // Only the first successful insert adjusts inventory.
  if (inserted) {
    await decrementStockForSession(db, session);
  }

  await db.collection("carts").updateOne(
    { userId },
    { $set: { items: [], updatedAt: new Date() } }
  );

  return { paid: true, fulfilled: true };
}
