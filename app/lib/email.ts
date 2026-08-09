import { Resend } from "resend";
import type { Order } from "@/app/lib/orders";
import { getAppUrl } from "@/app/lib/stripe";

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount);
}

function formatAddress(order: Order): string | null {
  const a = order.shippingAddress;
  if (!a?.line1) return null;

  const lines = [
    a.name,
    a.line1,
    a.line2,
    [a.city, a.state, a.postalCode].filter(Boolean).join(", "),
    a.country,
  ].filter(Boolean);

  return lines.join("\n");
}

function buildOrderConfirmationHtml(order: Order, shopUrl: string) {
  const itemRows = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;color:#111827;">
            ${item.name}
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;text-align:center;color:#6b7280;">
            ${item.quantity}
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;text-align:right;color:#111827;">
            ${formatMoney(item.unitAmount * item.quantity, order.currency)}
          </td>
        </tr>`
    )
    .join("");

  const shipping = formatAddress(order);

  return `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif;color:#111827;">
    <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
      <div style="background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <p style="margin:0 0 8px;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#2563eb;">
          StyleShop
        </p>
        <h1 style="margin:0 0 12px;font-size:28px;line-height:1.2;">Thank you for your order</h1>
        <p style="margin:0 0 24px;color:#6b7280;line-height:1.6;">
          We received your payment and your order is confirmed. You can keep shopping anytime.
        </p>

        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <thead>
            <tr>
              <th style="padding:0 0 8px;text-align:left;font-size:12px;color:#6b7280;text-transform:uppercase;">Item</th>
              <th style="padding:0 0 8px;text-align:center;font-size:12px;color:#6b7280;text-transform:uppercase;">Qty</th>
              <th style="padding:0 0 8px;text-align:right;font-size:12px;color:#6b7280;text-transform:uppercase;">Total</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>

        <div style="border-top:1px solid #e5e7eb;padding-top:16px;margin-bottom:24px;">
          <p style="margin:0 0 8px;display:flex;justify-content:space-between;color:#6b7280;">
            <span>Subtotal</span>
            <span>${formatMoney(order.subtotal, order.currency)}</span>
          </p>
          <p style="margin:0 0 8px;display:flex;justify-content:space-between;color:#6b7280;">
            <span>Shipping</span>
            <span>${formatMoney(order.shippingCost, order.currency)}</span>
          </p>
          <p style="margin:0;display:flex;justify-content:space-between;font-size:18px;font-weight:700;color:#111827;">
            <span>Total paid</span>
            <span>${formatMoney(order.total, order.currency)}</span>
          </p>
        </div>

        ${
          shipping
            ? `<div style="background:#f9fafb;border-radius:12px;padding:16px;margin-bottom:24px;">
                <p style="margin:0 0 8px;font-size:12px;font-weight:700;text-transform:uppercase;color:#6b7280;">Shipping to</p>
                <p style="margin:0;white-space:pre-line;line-height:1.6;color:#374151;">${shipping}</p>
              </div>`
            : ""
        }

        <a href="${shopUrl}/products" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700;">
          Continue shopping
        </a>

        <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;line-height:1.6;">
          Order reference: ${order.stripeSessionId}
        </p>
      </div>
    </div>
  </body>
</html>`;
}

/**
 * Sends a branded order confirmation email. No-op when Resend is not configured.
 * Failures are logged but do not block order fulfillment.
 */
export async function sendOrderConfirmationEmail(order: Order): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const to = order.customerEmail;
  if (!to) return;

  const from =
    process.env.RESEND_FROM_EMAIL || "StyleShop <onboarding@resend.dev>";
  const shopUrl = getAppUrl();

  const resend = new Resend(apiKey);

  try {
    await resend.emails.send({
      from,
      to,
      subject: `Your StyleShop order confirmation — ${formatMoney(order.total, order.currency)}`,
      html: buildOrderConfirmationHtml(order, shopUrl),
    });
  } catch (err) {
    console.error("Failed to send order confirmation email:", err);
  }
}

function buildShippingNotificationHtml(order: Order, shopUrl: string) {
  const carrierLine = order.carrier
    ? `<p style="margin:0 0 8px;color:#6b7280;">Carrier: <strong style="color:#111827;">${order.carrier}</strong></p>`
    : "";

  return `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif;color:#111827;">
    <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
      <div style="background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <p style="margin:0 0 8px;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#2563eb;">
          StyleShop
        </p>
        <h1 style="margin:0 0 12px;font-size:28px;line-height:1.2;">Your order is on the way</h1>
        <p style="margin:0 0 24px;color:#6b7280;line-height:1.6;">
          Good news — we&apos;ve shipped your order. Use the tracking details below to follow the delivery.
        </p>

        <div style="background:#f9fafb;border-radius:12px;padding:16px;margin-bottom:24px;">
          <p style="margin:0 0 8px;font-size:12px;font-weight:700;text-transform:uppercase;color:#6b7280;">Tracking</p>
          ${carrierLine}
          <p style="margin:0;font-size:18px;font-weight:700;letter-spacing:0.02em;color:#111827;">
            ${order.trackingNumber}
          </p>
        </div>

        <a href="${shopUrl}/orders/${encodeURIComponent(order.stripeSessionId)}${
          order.customerEmail
            ? `?email=${encodeURIComponent(order.customerEmail)}`
            : ""
        }" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700;">
          View order details
        </a>

        <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;line-height:1.6;">
          Order reference: ${order.stripeSessionId}
        </p>
      </div>
    </div>
  </body>
</html>`;
}

/**
 * Notifies the customer that their order has shipped. No-op without Resend config.
 */
export async function sendShippingNotificationEmail(order: Order): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const to = order.customerEmail;
  if (!to || !order.trackingNumber) return;

  const from =
    process.env.RESEND_FROM_EMAIL || "StyleShop <onboarding@resend.dev>";
  const shopUrl = getAppUrl();
  const resend = new Resend(apiKey);

  try {
    await resend.emails.send({
      from,
      to,
      subject: `Your StyleShop order has shipped${
        order.carrier ? ` via ${order.carrier}` : ""
      }`,
      html: buildShippingNotificationHtml(order, shopUrl),
    });
  } catch (err) {
    console.error("Failed to send shipping notification email:", err);
  }
}
