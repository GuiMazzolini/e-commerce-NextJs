import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDB } from "@/app/api/db";
import { users } from "@/app/lib/db-collections";
import { isDuplicateKeyError } from "@/app/lib/mongo-errors";
import { parseBody } from "@/app/lib/api-request";
import { registerSchema } from "@/app/lib/schemas";
import { enforceRateLimit, RATE_LIMITS } from "@/app/lib/rate-limit";

export async function POST(request: Request) {
  const limited = await enforceRateLimit(
    request,
    "register",
    RATE_LIMITS.register.limit,
    RATE_LIMITS.register.windowSec
  );
  if (limited) return limited;

  const parsed = await parseBody(request, registerSchema);
  if (!parsed.ok) return parsed.response;
  const { name, email, password } = parsed.data;

  const { db } = await connectToDB();
  const existing = await users(db).findOne({ email });

  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    await users(db).insertOne({
      name,
      email,
      passwordHash,
      createdAt: new Date(),
    });
  } catch (err) {
    // The check above races: two concurrent signups both pass it. The unique
    // index on users.email is what actually enforces uniqueness.
    if (isDuplicateKeyError(err)) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }
    throw err;
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
