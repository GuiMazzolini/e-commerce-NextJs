import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { connectToDB } from "@/app/api/db";
import { authOptions } from "@/app/lib/auth";
import { users } from "@/app/lib/db-collections";
import { normalizeEmail } from "@/app/lib/normalize-email";
import { badRequest, parseBody, unauthorized } from "@/app/lib/api-request";
import { passwordChangeSchema } from "@/app/lib/schemas";
import { enforceRateLimit, RATE_LIMITS } from "@/app/lib/rate-limit";

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return unauthorized();

  // Same budget as login: this endpoint also verifies a password, so leaving
  // it open would just move the guessing target.
  const limited = await enforceRateLimit(
    req,
    "password-change",
    RATE_LIMITS.login.limit,
    RATE_LIMITS.login.windowSec
  );
  if (limited) return limited;

  const parsed = await parseBody(req, passwordChangeSchema);
  if (!parsed.ok) return parsed.response;
  const { currentPassword, newPassword } = parsed.data;

  const { db } = await connectToDB();
  const email = normalizeEmail(session.user.email);
  const user = await users(db).findOne({ email });

  if (!user) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  if (user.passwordHash) {
    // Changing an existing password requires proving you know it — a stolen
    // session should not be enough to lock the real owner out.
    if (!currentPassword) {
      return badRequest("Your current password is required");
    }
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Your current password is incorrect" },
        { status: 403 }
      );
    }
    if (currentPassword === newPassword) {
      return badRequest("The new password must be different");
    }
  }
  // An OAuth account has no password yet, so there is nothing to prove.
  // Setting one adds the credentials login without removing OAuth.

  await users(db).updateOne(
    { email },
    {
      $set: {
        passwordHash: await bcrypt.hash(newPassword, 12),
        updatedAt: new Date(),
      },
    }
  );

  return NextResponse.json({ ok: true, hasPassword: true });
}
