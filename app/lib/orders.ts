import { connectToDB } from "@/app/api/db";
import {
  sendOrderConfirmationEmail,
  sendShippingNotificationEmail,
} from "@/app/lib/email";
import { getStripe } from "@/app/lib/stripe";
import { decodeCartItemsMetadata } from "@/app/lib/cart-metadata";
import { carts, orders, products } from "@/app/lib/db-collections";
import { isDuplicateKeyError } from "@/app/lib/mongo-errors";
import { normalizeEmail } from "@/app/lib/normalize-email";
import type { Db } from "mongodb";
import type Stripe from "stripe";

export { normalizeEmail };

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

export type OrderStatus = "paid" | "shipped";

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
  status: OrderStatus;
  trackingNumber: string | null;
  carrier: string | null;
  shippedAt: Date | null;
  createdAt: Date;
};

export function toOrder(doc: Record<string, unknown>): Order {
  const status = doc.status === "shipped" ? "shipped" : "paid";
  return {
    stripeSessionId: String(doc.stripeSessionId),
    userId: String(doc.userId),
    customerEmail: doc.customerEmail ? String(doc.customerEmail) : null,
    items: Array.isArray(doc.items) ? (doc.items as Order["items"]) : [],
    subtotal: Number(doc.subtotal),
    shippingCost: Number(doc.shippingCost),
    total: Number(doc.total),
    currency: String(doc.currency ?? "usd"),
    shippingAddress: (doc.shippingAddress as ShippingAddress | null) ?? null,
    status,
    trackingNumber: doc.trackingNumber ? String(doc.trackingNumber) : null,
    carrier: doc.carrier ? String(doc.carrier) : null,
    shippedAt: doc.shippedAt ? new Date(doc.shippedAt as string | Date) : null,
    createdAt: new Date(doc.createdAt as string | Date),
  };
}

function centsToDollars(cents: number | null | undefined): number {
  return (cents ?? 0) / 100;
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
    trackingNumber: null,
    carrier: null,
    shippedAt: null,
    createdAt: new Date(),
  };
}

async function decrementStockForSession(
  db: Db,
  session: Stripe.Checkout.Session
) {
  const cartItems = decodeCartItemsMetadata(session.metadata?.cartItems);
  for (const item of cartItems) {
    const result = await products(db).updateOne(
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

export async function getOrdersForUser(email: string): Promise<Order[]> {
  const { db } = await connectToDB();
  const orderDocs = await orders(db)
    .find({ userId: normalizeEmail(email) })
    .sort({ createdAt: -1 })
    .toArray();

  return orderDocs.map((doc) => toOrder(doc as Record<string, unknown>));
}

export async function getAllOrders(): Promise<Order[]> {
  const { db } = await connectToDB();
  const orderDocs = await db
    .collection("orders")
    .find({})
    .sort({ createdAt: -1 })
    .toArray();

  return orderDocs.map((doc: Record<string, unknown>) => toOrder(doc));
}

/**
 * Mark an order as shipped. Optionally notify the customer by email.
 */
export async function markOrderShipped({
  sessionId,
  trackingNumber,
  carrier,
  sendEmail = true,
}: {
  sessionId: string;
  trackingNumber: string;
  carrier?: string | null;
  sendEmail?: boolean;
}): Promise<Order | null> {
  const tracking = trackingNumber.trim();
  if (!tracking) {
    throw new Error("Tracking number is required");
  }

  const carrierValue = carrier?.trim() || null;
  const shippedAt = new Date();

  const { db } = await connectToDB();
  const result = await db.collection("orders").findOneAndUpdate(
    { stripeSessionId: sessionId },
    {
      $set: {
        status: "shipped",
        trackingNumber: tracking,
        carrier: carrierValue,
        shippedAt,
      },
    },
    { returnDocument: "after" }
  );

  const doc = result as Record<string, unknown> | null;
  if (!doc) return null;

  const order = toOrder(doc);
  if (sendEmail) {
    await sendShippingNotificationEmail(order);
  }

  return order;
}

export async function getOrderBySessionId(
  sessionId: string
): Promise<Order | null> {
  const { db } = await connectToDB();
  const orderDoc = await orders(db).findOne({ stripeSessionId: sessionId });

  if (!orderDoc) return null;
  return toOrder(orderDoc as Record<string, unknown>);
}

export async function getAccessibleOrder({
  sessionId,
  sessionEmail,
  guestEmail,
}: {
  sessionId: string;
  sessionEmail?: string | null;
  guestEmail?: string | null;
}): Promise<Order | null> {
  const order = await getOrderBySessionId(sessionId);
  if (!order) return null;
  return canAccessOrder(order, { sessionEmail, guestEmail }) ? order : null;
}

/**
 * Owner or matching guest email may view an order. Case-insensitive on both
 * checks: `userId` may come from Stripe's `customer_details.email`, which is
 * whatever casing the buyer typed, while the session email comes from the
 * account. Comparing those exactly locks owners out of their own orders.
 */
export function canAccessOrder(
  order: Pick<Order, "userId" | "customerEmail">,
  {
    sessionEmail,
    guestEmail,
  }: {
    sessionEmail?: string | null;
    guestEmail?: string | null;
  }
): boolean {
  if (sessionEmail && normalizeEmail(order.userId) === normalizeEmail(sessionEmail)) {
    return true;
  }

  if (
    guestEmail &&
    order.customerEmail &&
    normalizeEmail(order.customerEmail) === normalizeEmail(guestEmail)
  ) {
    return true;
  }

  return false;
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

  const rawUserId =
    session.client_reference_id ||
    session.metadata?.userId ||
    session.customer_details?.email ||
    session.customer_email;

  if (!rawUserId || typeof rawUserId !== "string") {
    return { paid: true, fulfilled: false };
  }

  const userId = normalizeEmail(rawUserId);

  // Only an authenticated checkout carries client_reference_id. A guest can
  // type any address into Stripe, so trusting the collected email here would
  // let them empty a registered user's saved cart.
  const isAuthenticatedCheckout = Boolean(
    session.client_reference_id || session.metadata?.userId
  );

  const { db } = await connectToDB();
  const order = buildOrderFromStripeSession(session, userId);

  let inserted = false;
  try {
    await orders(db).insertOne(order);
    inserted = true;
  } catch (err) {
    if (!isDuplicateKeyError(err)) throw err;
  }

  // Only the first successful insert adjusts inventory and sends email.
  if (inserted) {
    await decrementStockForSession(db, session);
    await sendOrderConfirmationEmail(order);
  }

  if (isAuthenticatedCheckout) {
    await carts(db).updateOne(
      { userId },
      { $set: { items: [], updatedAt: new Date() } }
    );
  }

  return { paid: true, fulfilled: true };
}
