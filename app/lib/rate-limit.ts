import { connectToDB } from "@/app/api/db";
import { rateLimits } from "@/app/lib/db-collections";
import { NextResponse } from "next/server";

export type RateLimitResult = { ok: boolean; retryAfter: number };

/**
 * Fixed-window rate limiter backed by MongoDB.
 *
 * Deliberately not implemented in middleware: several Next.js advisories are
 * middleware/proxy bypasses, so a control placed there can be routed around.
 * Route handlers run on the Node runtime and cannot be skipped.
 *
 * Mongo is used rather than an in-memory Map because the deploy target is not
 * fixed yet — on serverless, per-instance state would silently stop limiting
 * anything. Swap this implementation for Upstash/Redis if the extra round trip
 * ever matters; callers only depend on the signature below.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSec: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = Math.floor(now / (windowSec * 1000));
  const id = `${key}:${windowStart}`;
  const expiresAt = new Date((windowStart + 1) * windowSec * 1000);

  try {
    const doc = await rateLimits((await connectToDB()).db).findOneAndUpdate(
      { _id: id },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt } },
      { upsert: true, returnDocument: "after" }
    );

    const count = doc?.count ?? 1;
    if (count > limit) {
      return {
        ok: false,
        retryAfter: Math.max(1, Math.ceil((expiresAt.getTime() - now) / 1000)),
      };
    }
    return { ok: true, retryAfter: 0 };
  } catch (err) {
    // Fail open: a limiter outage must not take checkout down with it.
    console.error("Rate limit check failed:", err);
    return { ok: true, retryAfter: 0 };
  }
}

/**
 * Client IP for rate-limit bucketing.
 *
 * Falls back to a shared "unknown" bucket rather than a unique value, so a
 * caller who strips the header lands in one throttled pool instead of getting
 * an unlimited private bucket each time.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

export function tooManyRequests(retryAfter: number): NextResponse {
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}

/**
 * Guard a route handler. Returns a 429 response when the caller is over
 * budget, or null to continue.
 */
export async function enforceRateLimit(
  req: Request,
  bucket: string,
  limit: number,
  windowSec: number
): Promise<NextResponse | null> {
  const { ok, retryAfter } = await checkRateLimit(
    `${bucket}:${getClientIp(req)}`,
    limit,
    windowSec
  );
  return ok ? null : tooManyRequests(retryAfter);
}

/** Budgets, in one place so they are reviewable together. */
export const RATE_LIMITS = {
  register: { limit: 5, windowSec: 3600 },
  login: { limit: 10, windowSec: 900 },
  checkout: { limit: 20, windowSec: 3600 },
  cartMerge: { limit: 30, windowSec: 3600 },
  uploadSign: { limit: 60, windowSec: 3600 },
} as const;
