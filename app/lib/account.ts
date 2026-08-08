import { connectToDB } from "@/app/api/db";
import { users, type SavedAddress, type UserDoc } from "@/app/lib/db-collections";
import { normalizeEmail } from "@/app/lib/normalize-email";
import { getStripe } from "@/app/lib/stripe";

/** What the account page is allowed to see. Never leaks passwordHash. */
export type AccountProfile = {
  email: string;
  name: string;
  address: SavedAddress | null;
  /** False for OAuth accounts, which have no password to change. */
  hasPassword: boolean;
  provider: string;
  createdAt: string;
};

export function toAccountProfile(doc: UserDoc): AccountProfile {
  return {
    email: doc.email,
    name: doc.name,
    address: doc.address ?? null,
    hasPassword: Boolean(doc.passwordHash),
    provider: doc.provider ?? "credentials",
    createdAt: (doc.createdAt ?? new Date()).toISOString(),
  };
}

export async function getAccountProfile(
  email: string
): Promise<AccountProfile | null> {
  const { db } = await connectToDB();
  const doc = await users(db).findOne({ email: normalizeEmail(email) });
  return doc ? toAccountProfile(doc) : null;
}

/**
 * Stripe's hosted Checkout prefills shipping from the Customer attached to the
 * session, so a saved address only reaches the buyer if it lives on a Customer
 * object. Created lazily on first address save rather than at signup, so
 * accounts that never save one cost nothing.
 */
export async function syncStripeCustomerAddress(
  email: string,
  name: string,
  address: SavedAddress,
  existingCustomerId?: string
): Promise<string | null> {
  let stripe;
  try {
    stripe = getStripe();
  } catch {
    // Stripe not configured (local dev): saving the address must still work.
    return existingCustomerId ?? null;
  }

  const shipping = {
    name,
    address: {
      line1: address.line1,
      line2: address.line2 ?? undefined,
      city: address.city,
      state: address.state ?? undefined,
      postal_code: address.postalCode,
      country: address.country,
    },
  };

  try {
    if (existingCustomerId) {
      await stripe.customers.update(existingCustomerId, { name, shipping });
      return existingCustomerId;
    }
    const customer = await stripe.customers.create({ email, name, shipping });
    return customer.id;
  } catch (err) {
    // A Stripe outage should not lose the address the user just typed.
    console.error("Failed to sync Stripe customer address:", err);
    return existingCustomerId ?? null;
  }
}
