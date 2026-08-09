import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectToDB } from "@/app/api/db";
import { authOptions } from "@/app/lib/auth";
import { syncStripeCustomerAddress, toAccountProfile } from "@/app/lib/account";
import { users } from "@/app/lib/db-collections";
import { normalizeEmail } from "@/app/lib/normalize-email";
import { parseBody, unauthorized } from "@/app/lib/api-request";
import { addressSchema } from "@/app/lib/schemas";

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return unauthorized();

  const parsed = await parseBody(req, addressSchema);
  if (!parsed.ok) return parsed.response;

  const email = normalizeEmail(session.user.email);
  const { db } = await connectToDB();
  const user = await users(db).findOne({ email });
  if (!user) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  // Mirror onto a Stripe Customer, which is what actually makes Checkout
  // prefill the address. Failure here is logged, not fatal.
  const stripeCustomerId = await syncStripeCustomerAddress(
    email,
    user.name,
    parsed.data,
    user.stripeCustomerId
  );

  const updated = await users(db).findOneAndUpdate(
    { email },
    {
      $set: {
        address: parsed.data,
        updatedAt: new Date(),
        ...(stripeCustomerId ? { stripeCustomerId } : {}),
      },
    },
    { returnDocument: "after" }
  );

  return NextResponse.json(updated ? toAccountProfile(updated) : { ok: true });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return unauthorized();

  const { db } = await connectToDB();
  const updated = await users(db).findOneAndUpdate(
    { email: normalizeEmail(session.user.email) },
    { $set: { address: null, updatedAt: new Date() } },
    { returnDocument: "after" }
  );

  if (!updated) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }
  return NextResponse.json(toAccountProfile(updated));
}
