import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { getOrdersForUser, type Order } from "@/app/lib/orders";
import { redirect } from "next/navigation";
import { formatOrderDate, OrderStatusBadge } from "./order-ui";

export const metadata: Metadata = {
  title: "Order History",
};

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login?callbackUrl=/orders");
  }

  const orders: Order[] = await getOrdersForUser(session.user.email);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Order History</h1>
        <p className="text-gray-600 mb-8">
          Your past purchases. Open an order for items, shipping, and tracking.
        </p>

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
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm divide-y divide-gray-100">
            {orders.map((order: Order) => (
              <div
                key={order.stripeSessionId}
                className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
              >
                <div className="min-w-0 space-y-1">
                  <p className="font-semibold text-gray-900">
                    {formatOrderDate(order.createdAt)}
                  </p>
                  <OrderStatusBadge order={order} />
                </div>

                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                  <p className="text-lg font-bold text-blue-600">
                    ${order.total.toFixed(2)}
                  </p>
                  <Link
                    href={`/orders/${order.stripeSessionId}`}
                    className="font-semibold text-blue-600 hover:text-blue-700"
                  >
                    View order details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
