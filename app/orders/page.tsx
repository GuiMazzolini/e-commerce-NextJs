import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { getOrdersForUser, type Order } from "@/app/lib/orders";
import { redirect } from "next/navigation";
import {
  formatOrderDate,
  OrderItems,
  OrderShipping,
  OrderTotals,
} from "./order-ui";

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
            {orders.map((order: Order) => (
              <article
                key={order.stripeSessionId}
                className="bg-white rounded-xl shadow-md overflow-hidden"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-4 bg-gray-50">
                  <div>
                    <p className="text-sm text-gray-500">Order placed</p>
                    <p className="font-semibold text-gray-900">
                      {formatOrderDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-xl font-bold text-blue-600">${order.total.toFixed(2)}</p>
                  </div>
                </div>

                <div className="px-6 py-5 space-y-4">
                  <OrderItems order={order} />
                  <OrderTotals order={order} />
                  <OrderShipping order={order} />

                  <div className="border-t border-gray-100 pt-4">
                    <Link
                      href={`/orders/${order.stripeSessionId}`}
                      className="font-semibold text-blue-600 hover:text-blue-700"
                    >
                      View order details →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
