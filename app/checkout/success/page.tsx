import Link from "next/link";
import { getStripe } from "@/app/lib/stripe";

type Props = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { session_id } = await searchParams;
  let paid = false;

  if (session_id) {
    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(session_id);
      paid = session.payment_status === "paid";
    } catch {
      paid = false;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-lg">
        <div className="bg-white rounded-2xl shadow-lg p-10 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {paid ? "Thank you!" : "Payment status"}
          </h1>
          <p className="text-gray-600 mb-8">
            {paid
              ? "Your order was received. You will get a confirmation from Stripe by email."
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
        </div>
      </div>
    </div>
  );
}
