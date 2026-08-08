import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectToDB } from "@/app/api/db";
import { authOptions } from "@/app/lib/auth";
import { toAccountProfile } from "@/app/lib/account";
import { users } from "@/app/lib/db-collections";
import { normalizeEmail } from "@/app/lib/normalize-email";
import { parseBody, unauthorized } from "@/app/lib/api-request";
import { profileSchema } from "@/app/lib/schemas";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return unauthorized();

  const parsed = await parseBody(req, profileSchema);
  if (!parsed.ok) return parsed.response;

  const { db } = await connectToDB();
  const updated = await users(db).findOneAndUpdate(
    { email: normalizeEmail(session.user.email) },
    { $set: { name: parsed.data.name, updatedAt: new Date() } },
    { returnDocument: "after" }
  );

  if (!updated) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  return NextResponse.json(toAccountProfile(updated));
}
