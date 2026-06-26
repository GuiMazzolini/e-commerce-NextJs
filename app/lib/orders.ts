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
