import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDB } from "@/app/api/db";
import type { Order, ShippingAddress } from "@/app/lib/orders";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Order History",
};

function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

function formatAddress(address: ShippingAddress): string {
  const parts = [
    address.line1,
    address.line2,
    [address.city, address.state].filter(Boolean).join(", "),
    address.postalCode,
    address.country,
  ].filter(Boolean);
  return parts.join("\n");
}

function toOrder(doc: Record<string, unknown>): Order {
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
    status: "paid",
    createdAt: new Date(doc.createdAt as string | Date),
  };
}

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/api/auth/signin?callbackUrl=/orders");
  }

  const { db } = await connectToDB();
  const orderDocs = await db
    .collection("orders")
    .find({ userId: session.user.email })
    .sort({ createdAt: -1 })
    .toArray();

  const orders = orderDocs.map((doc) => toOrder(doc as Record<string, unknown>));

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Order History</h1>
        <p className="text-gray-600 mb-8">Your past purchases and shipping details.</p>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">No orders yet</h2>
            <p className="text-gray-600 mb-8">
              When you complete a purchase, your orders will show up here.
            </p>
            <Link
              href="/products"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <article
                key={order.stripeSessionId}
                className="bg-white rounded-xl shadow-md overflow-hidden"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-4 bg-gray-50">
                  <div>
                    <p className="text-sm text-gray-500">Order placed</p>
                    <p className="font-semibold text-gray-900">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-xl font-bold text-blue-600">${order.total.toFixed(2)}</p>
                  </div>
                </div>

                <div className="px-6 py-5 space-y-4">
                  <ul className="divide-y divide-gray-100">
                    {order.items.map((item, index) => (
                      <li
                        key={`${order.stripeSessionId}-${index}`}
                        className="flex justify-between py-3 text-sm"
                      >
                        <span className="text-gray-900">
                          {item.name}{" "}
                          <span className="text-gray-500">× {item.quantity}</span>
                        </span>
                        <span className="font-medium text-gray-900">
                          ${(item.unitAmount * item.quantity).toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="border-t border-gray-100 pt-4 space-y-1 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>${order.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>
                        {order.shippingCost === 0
                          ? "FREE"
                          : `$${order.shippingCost.toFixed(2)}`}
                      </span>
                    </div>
                  </div>

                  {order.shippingAddress && (
                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-sm font-semibold text-gray-900 mb-1">
                        Shipped to
                      </p>
                      {order.shippingAddress.name && (
                        <p className="text-sm text-gray-700">{order.shippingAddress.name}</p>
                      )}
                      <p className="text-sm text-gray-600 whitespace-pre-line">
                        {formatAddress(order.shippingAddress)}
                      </p>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
