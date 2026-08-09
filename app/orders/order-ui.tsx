import type { Order, OrderItem, ShippingAddress } from "@/app/lib/orders";

export function formatOrderDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export function formatOrderAddress(address: ShippingAddress): string {
  const parts = [
    address.line1,
    address.line2,
    [address.city, address.state].filter(Boolean).join(", "),
    address.postalCode,
    address.country,
  ].filter(Boolean);
  return parts.join("\n");
}

export function OrderItems({ order }: { order: Order }) {
  return (
    <ul className="divide-y divide-gray-100">
      {order.items.map((item: OrderItem, index: number) => (
        <li
          key={`${order.stripeSessionId}-${index}`}
          className="flex justify-between py-3 text-sm"
        >
          <span className="text-gray-900">
            {item.name} <span className="text-gray-500">× {item.quantity}</span>
          </span>
          <span className="font-medium text-gray-900">
            ${(item.unitAmount * item.quantity).toFixed(2)}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function OrderTotals({ order }: { order: Order }) {
  return (
    <div className="border-t border-gray-100 pt-4 space-y-1 text-sm text-gray-600">
      <div className="flex justify-between">
        <span>Subtotal</span>
        <span>${order.subtotal.toFixed(2)}</span>
      </div>
      <div className="flex justify-between">
        <span>Shipping</span>
        <span>
          {order.shippingCost === 0 ? "FREE" : `$${order.shippingCost.toFixed(2)}`}
        </span>
      </div>
      <div className="flex justify-between pt-2 text-base font-semibold text-gray-900">
        <span>Total</span>
        <span>${order.total.toFixed(2)}</span>
      </div>
    </div>
  );
}

export function OrderShipping({ order }: { order: Order }) {
  if (!order.shippingAddress) return null;

  return (
    <div className="border-t border-gray-100 pt-4">
      <p className="text-sm font-semibold text-gray-900 mb-1">Shipped to</p>
      {order.shippingAddress.name && (
        <p className="text-sm text-gray-700">{order.shippingAddress.name}</p>
      )}
      <p className="text-sm text-gray-600 whitespace-pre-line">
        {formatOrderAddress(order.shippingAddress)}
      </p>
    </div>
  );
}

export function OrderStatusBadge({ order }: { order: Order }) {
  const shipped = order.status === "shipped";
  return (
    <span
      className={
        shipped
          ? "rounded-md bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800"
          : "rounded-md bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800"
      }
    >
      {shipped ? "Shipped" : "Paid"}
    </span>
  );
}

export function OrderTracking({ order }: { order: Order }) {
  if (order.status !== "shipped" || !order.trackingNumber) return null;

  return (
    <div className="border-t border-gray-100 pt-4">
      <p className="text-sm font-semibold text-gray-900 mb-1">Tracking</p>
      {order.carrier && (
        <p className="text-sm text-gray-600">Carrier: {order.carrier}</p>
      )}
      <p className="text-sm font-medium text-gray-900 tracking-wide">
        {order.trackingNumber}
      </p>
      {order.shippedAt && (
        <p className="mt-1 text-xs text-gray-500">
          Shipped {formatOrderDate(order.shippedAt)}
        </p>
      )}
    </div>
  );
}

