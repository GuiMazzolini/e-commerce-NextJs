import { describe, expect, it } from "vitest";
import { toAccountProfile } from "@/app/lib/account";
import { addressSchema, passwordChangeSchema, profileSchema } from "@/app/lib/schemas";
import type { UserDoc } from "@/app/lib/db-collections";

const baseUser: UserDoc = {
  email: "ada@example.com",
  name: "Ada",
  passwordHash: "$2a$12$hash",
  createdAt: new Date("2026-01-01T00:00:00Z"),
};

describe("toAccountProfile", () => {
  it("never exposes the password hash", () => {
    const profile = toAccountProfile(baseUser);
    expect(JSON.stringify(profile)).not.toContain("$2a$12$hash");
    expect("passwordHash" in profile).toBe(false);
  });

  it("reports whether a password exists rather than what it is", () => {
    expect(toAccountProfile(baseUser).hasPassword).toBe(true);
    expect(
      toAccountProfile({ ...baseUser, passwordHash: undefined }).hasPassword
    ).toBe(false);
  });

  it("defaults provider and address for records predating those fields", () => {
    const profile = toAccountProfile({ ...baseUser, provider: undefined });
    expect(profile.provider).toBe("credentials");
    expect(profile.address).toBeNull();
  });
});

describe("profileSchema", () => {
  it("trims the name and rejects blank input", () => {
    expect(profileSchema.parse({ name: "  Ada  " }).name).toBe("Ada");
    expect(profileSchema.safeParse({ name: "   " }).success).toBe(false);
    expect(profileSchema.safeParse({ name: "a".repeat(101) }).success).toBe(false);
  });
});

describe("passwordChangeSchema", () => {
  it("requires at least 8 characters for the new password", () => {
    expect(
      passwordChangeSchema.safeParse({ currentPassword: "x", newPassword: "short" }).success
    ).toBe(false);
    expect(
      passwordChangeSchema.safeParse({ currentPassword: "x", newPassword: "longenough" }).success
    ).toBe(true);
  });

  it("allows omitting the current password, for OAuth accounts setting a first one", () => {
    expect(passwordChangeSchema.safeParse({ newPassword: "longenough" }).success).toBe(true);
  });
});

describe("addressSchema", () => {
  const valid = {
    line1: "1 Main St",
    city: "Austin",
    postalCode: "78701",
    country: "us",
  };

  it("uppercases the country code", () => {
    expect(addressSchema.parse(valid).country).toBe("US");
  });

  it("normalizes blank optional fields to null", () => {
    const parsed = addressSchema.parse({ ...valid, line2: "  ", state: "" });
    expect(parsed.line2).toBeNull();
    expect(parsed.state).toBeNull();
  });

  it("requires the fields Stripe needs to prefill", () => {
    expect(addressSchema.safeParse({ ...valid, line1: "" }).success).toBe(false);
    expect(addressSchema.safeParse({ ...valid, city: "" }).success).toBe(false);
    expect(addressSchema.safeParse({ ...valid, postalCode: "" }).success).toBe(false);
    expect(addressSchema.safeParse({ ...valid, country: "USA" }).success).toBe(false);
  });
});
