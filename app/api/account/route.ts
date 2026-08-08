import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectToDB } from "@/app/api/db";
import { authOptions } from "@/app/lib/auth";
import { getAccountProfile } from "@/app/lib/account";
import { carts, users } from "@/app/lib/db-collections";
import { normalizeEmail } from "@/app/lib/normalize-email";
import { unauthorized } from "@/app/lib/api-request";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return unauthorized();

  const profile = await getAccountProfile(session.user.email);
  if (!profile) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }
  return NextResponse.json(profile);
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return unauthorized();

  const email = normalizeEmail(session.user.email);
  const { db } = await connectToDB();

  const result = await users(db).deleteOne({ email });
  if (result.deletedCount === 0) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  await carts(db).deleteOne({ userId: email });

  // Orders are deliberately kept: they are financial records, and the guest
  // lookup by email + session id must keep working after an account is gone.
  return NextResponse.json({ ok: true });
}
