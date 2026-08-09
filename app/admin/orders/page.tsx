import type { Metadata } from "next";
import Link from "next/link";
import { getAllOrders } from "@/app/lib/orders";
import { formatOrderDate } from "@/app/orders/order-ui";
import ShipOrderForm from "./ShipOrderForm";

export const metadata: Metadata = {
  title: "Admin — Orders",
  robots: { index: false, follow: false },
};

export default async function AdminOrdersPage() {
  const orders = await getAllOrders();
  const awaitingShipment = orders.filter((o) => o.status !== "shipped").length;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-gray-600">
          {orders.length} order{orders.length === 1 ? "" : "s"}
          {awaitingShipment > 0
            ? ` · ${awaitingShipment} awaiting shipment`
            : ""}
          . After you ship with DHL (or another carrier), add the tracking number
          below.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
          No orders yet. Complete a test checkout to see fulfillment here.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <article
              key={order.stripeSessionId}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 bg-gray-50 px-5 py-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={
                        order.status === "shipped"
                          ? "rounded-md bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800"
                          : "rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800"
                      }
                    >
                      {order.status === "shipped" ? "Shipped" : "Paid — pack & ship"}
                    </span>
                    <p className="text-sm text-gray-500">
                      {formatOrderDate(order.createdAt)}
                    </p>
                  </div>
                  <p className="mt-1 font-medium text-gray-900">
                    {order.customerEmail ?? order.userId}
                  </p>
                  <p className="font-mono text-xs text-gray-500">
                    {order.stripeSessionId}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-600">
                    ${order.total.toFixed(2)}
                  </p>
                  <Link
                    href={`/orders/${encodeURIComponent(order.stripeSessionId)}${
                      order.customerEmail
                        ? `?email=${encodeURIComponent(order.customerEmail)}`
                        : ""
                    }`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    Customer view
                  </Link>
                </div>
              </div>

              <div className="grid gap-5 px-5 py-4 lg:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm font-semibold text-gray-900">Items</p>
                  <ul className="space-y-1 text-sm text-gray-700">
                    {order.items.map((item, i) => (
                      <li key={`${order.stripeSessionId}-${i}`}>
                        {item.name} × {item.quantity}
                      </li>
                    ))}
                  </ul>
                  {order.shippingAddress && (
                    <div className="mt-4">
                      <p className="mb-1 text-sm font-semibold text-gray-900">
                        Ship to
                      </p>
                      <p className="text-sm text-gray-600 whitespace-pre-line">
                        {[
                          order.shippingAddress.name,
                          order.shippingAddress.line1,
                          order.shippingAddress.line2,
                          [
                            order.shippingAddress.city,
                            order.shippingAddress.state,
                            order.shippingAddress.postalCode,
                          ]
                            .filter(Boolean)
                            .join(", "),
                          order.shippingAddress.country,
                        ]
                          .filter(Boolean)
                          .join("\n")}
                      </p>
                    </div>
                  )}
                  {order.status === "shipped" && order.trackingNumber && (
                    <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900">
                      <p className="font-semibold">
                        Tracking: {order.trackingNumber}
                      </p>
                      {order.carrier && <p>Carrier: {order.carrier}</p>}
                      {order.shippedAt && (
                        <p className="text-xs text-green-800 mt-1">
                          Marked shipped {formatOrderDate(order.shippedAt)}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <ShipOrderForm
                  sessionId={order.stripeSessionId}
                  initialTracking={order.trackingNumber ?? ""}
                  initialCarrier={order.carrier ?? ""}
                  alreadyShipped={order.status === "shipped"}
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
