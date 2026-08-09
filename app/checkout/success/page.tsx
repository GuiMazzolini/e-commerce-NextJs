import Link from "next/link";
import { fulfillCheckoutSession, getOrderBySessionId } from "@/app/lib/orders";
import ClearCartOnSuccess from "./ClearCartOnSuccess";

type Props = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { session_id } = await searchParams;
  let paid = false;
  const lookupHref = session_id
    ? `/orders/lookup?order=${encodeURIComponent(session_id)}`
    : "/orders/lookup";

  // This page is reachable by anyone with a session id, and rendering it used
  // to write to Stripe and the database on a plain GET. Where the webhook is
  // configured it is the only fulfillment path; this fallback exists solely
  // for local development, where `stripe listen` may not be running.
  const webhookConfigured = Boolean(process.env.STRIPE_WEBHOOK_SECRET);

  if (session_id && !webhookConfigured) {
    try {
      const result = await fulfillCheckoutSession(session_id);
      paid = result.paid;
    } catch {
      paid = false;
    }
  } else if (session_id) {
    // The webhook owns fulfillment; just report whether it has landed yet.
    paid = (await getOrderBySessionId(session_id)) !== null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <ClearCartOnSuccess paid={paid} />
      <div className="container mx-auto px-4 max-w-lg">
        <div className="bg-white rounded-2xl shadow-lg p-10 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {paid ? "Thank you!" : "Payment status"}
          </h1>
          <p className="text-gray-600 mb-8">
            {paid
              ? "Your order was received. A StyleShop confirmation email is on its way (plus Stripe's receipt)."
              : session_id
                ? "We could not confirm this payment. If you were charged, contact support with your session details."
                : "Return to the store to complete a purchase."}
          </p>
          <Link
            href="/products"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Continue shopping
          </Link>
          <div className="mt-4">
            <Link
              href={lookupHref}
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              Look up this order
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
