import { connectToDB } from "@/app/api/db";
import { getStripe } from "@/app/lib/stripe";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET is not configured" }, { status: 501 });
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const stripe = getStripe();
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.client_reference_id || session.metadata?.userId;
    if (userId && typeof userId === "string") {
      const { db } = await connectToDB();
      await db.collection("carts").updateOne(
        { userId },
        { $set: { items: [], updatedAt: new Date() } }
      );
    }
  }

  return NextResponse.json({ received: true });
}
