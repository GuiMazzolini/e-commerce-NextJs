import type { Metadata } from "next";
import Link from "next/link";
import { getAccessibleOrder } from "@/app/lib/orders";
import {
  formatOrderDate,
  OrderItems,
  OrderTotals,
} from "../order-ui";

type Props = {
  searchParams: Promise<{ order?: string; email?: string }>;
};

export const metadata: Metadata = {
  title: "Guest Order Lookup",
};

export default async function GuestOrderLookupPage({ searchParams }: Props) {
  const { order, email } = await searchParams;

  const normalizedOrder = order?.trim() || "";
  const normalizedEmail = email?.trim() || "";

  const result =
    normalizedOrder && normalizedEmail
      ? await getAccessibleOrder({
          sessionId: normalizedOrder,
          guestEmail: normalizedEmail,
        })
      : null;

  const lookupAttempted = Boolean(normalizedOrder && normalizedEmail);
  const detailHref =
    result && normalizedEmail
      ? `/orders/${result.stripeSessionId}?email=${encodeURIComponent(
          normalizedEmail
        )}`
      : null;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-3xl space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Guest order lookup
          </h1>
          <p className="text-gray-600">
            Enter the email used at checkout and your order reference
            (`session_id`) from the success page or confirmation email.
          </p>
        </div>

        <form
          action="/orders/lookup"
          method="GET"
          className="rounded-2xl bg-white shadow-lg p-6 space-y-4"
        >
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Email used at checkout
            </label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={normalizedEmail}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>

          <div>
            <label
              htmlFor="order"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Order reference / session id
            </label>
            <input
              id="order"
              name="order"
              defaultValue={normalizedOrder}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm"
            />
          </div>

          <button
            type="submit"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Find order
          </button>
        </form>

        {lookupAttempted && !result && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            We couldn&apos;t find an order for that email and reference.
          </div>
        )}

        {result && detailHref && (
          <article className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-4 bg-gray-50">
              <div>
                <p className="text-sm text-gray-500">Order placed</p>
                <p className="font-semibold text-gray-900">
                  {formatOrderDate(result.createdAt)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-xl font-bold text-blue-600">
                  ${result.total.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              <OrderItems order={result} />
              <OrderTotals order={result} />
              <div className="border-t border-gray-100 pt-4">
                <Link
                  href={detailHref}
                  className="font-semibold text-blue-600 hover:text-blue-700"
                >
                  View full order details →
                </Link>
              </div>
            </div>
          </article>
        )}
      </div>
    </div>
  );
}

