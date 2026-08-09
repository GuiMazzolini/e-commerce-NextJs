import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { getAccessibleOrder } from "@/app/lib/orders";
import {
  formatOrderDate,
  OrderItems,
  OrderShipping,
  OrderStatusBadge,
  OrderTotals,
  OrderTracking,
} from "../order-ui";

type Props = {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ email?: string }>;
};

export const metadata: Metadata = {
  title: "Order Details",
};

export default async function OrderDetailPage({
  params,
  searchParams,
}: Props) {
  const [{ sessionId }, { email }] = await Promise.all([params, searchParams]);
  const session = await getServerSession(authOptions);

  const order = await getAccessibleOrder({
    sessionId,
    sessionEmail: session?.user?.email,
    guestEmail: email,
  });

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="bg-white rounded-2xl shadow-lg p-10 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Order not found
            </h1>
            <p className="text-gray-600 mb-8">
              We couldn&apos;t find an order with those details. If you checked out
              as a guest, try the guest lookup page with the same email used at
              checkout.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={`/orders/lookup?order=${encodeURIComponent(sessionId)}`}
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Guest order lookup
              </Link>
              <Link
                href="/orders"
                className="inline-block bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Back to orders
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Order details</h1>
            <p className="text-gray-600 mt-2">
              Order reference:{" "}
              <span className="font-mono text-sm">{order.stripeSessionId}</span>
            </p>
          </div>
          <Link
            href="/orders"
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            ← Back to orders
          </Link>
        </div>

        <article className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-4 bg-gray-50">
            <div>
              <p className="text-sm text-gray-500">Order placed</p>
              <p className="font-semibold text-gray-900">
                {formatOrderDate(order.createdAt)}
              </p>
            </div>
            <div className="text-right space-y-2">
              <OrderStatusBadge order={order} />
              <p className="text-sm text-gray-500">Total paid</p>
              <p className="text-xl font-bold text-blue-600">
                ${order.total.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="px-6 py-5 space-y-4">
            <OrderItems order={order} />
            <OrderTotals order={order} />
            <OrderShipping order={order} />
            <OrderTracking order={order} />
          </div>
        </article>
      </div>
    </div>
  );
}

