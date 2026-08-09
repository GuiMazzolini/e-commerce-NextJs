import { afterEach, describe, expect, it } from "vitest";
import {
  isAdminEmail,
  normalizeProductImageUrl,
  slugifyProductId,
} from "@/app/lib/admin";

const originalAdminEmails = process.env.ADMIN_EMAILS;

afterEach(() => {
  process.env.ADMIN_EMAILS = originalAdminEmails;
});

describe("isAdminEmail", () => {
  it("matches regardless of casing and surrounding whitespace", () => {
    process.env.ADMIN_EMAILS = " Admin@Example.com , second@example.com ";
    expect(isAdminEmail("admin@example.com")).toBe(true);
    expect(isAdminEmail("  SECOND@EXAMPLE.COM  ")).toBe(true);
  });

  it("requires a full match, not a substring", () => {
    process.env.ADMIN_EMAILS = "admin@example.com";
    expect(isAdminEmail("notadmin@example.com")).toBe(false);
    expect(isAdminEmail("admin@example.com.evil.test")).toBe(false);
  });

  it("denies everyone when ADMIN_EMAILS is unset or empty", () => {
    delete process.env.ADMIN_EMAILS;
    expect(isAdminEmail("admin@example.com")).toBe(false);

    process.env.ADMIN_EMAILS = "";
    expect(isAdminEmail("admin@example.com")).toBe(false);
    expect(isAdminEmail("")).toBe(false);
    expect(isAdminEmail(null)).toBe(false);
    expect(isAdminEmail(undefined)).toBe(false);
  });
});

describe("normalizeProductImageUrl", () => {
  it("accepts an https Cloudinary URL", () => {
    const url = "https://res.cloudinary.com/demo/image/upload/v1/hat.jpg";
    expect(normalizeProductImageUrl(`  ${url}  `)).toBe(url);
  });

  it("rejects non-https schemes", () => {
    expect(() =>
      normalizeProductImageUrl("http://res.cloudinary.com/demo/image/upload/v1/x.jpg")
    ).toThrow(/https/);
    expect(() => normalizeProductImageUrl("javascript:alert(1)")).toThrow();
    expect(() => normalizeProductImageUrl("data:image/svg+xml,<svg/>")).toThrow();
  });

  it("rejects hosts outside the allowlist", () => {
    expect(() => normalizeProductImageUrl("https://evil.test/x.jpg")).toThrow(/host/);
    // Suffix tricks must not pass either.
    expect(() =>
      normalizeProductImageUrl("https://res.cloudinary.com.evil.test/x.jpg")
    ).toThrow(/host/);
  });

  it("rejects unparseable input", () => {
    expect(() => normalizeProductImageUrl("")).toThrow();
    expect(() => normalizeProductImageUrl("not a url")).toThrow();
  });
});

describe("slugifyProductId", () => {
  it("lowercases and collapses non-alphanumerics into single dashes", () => {
    expect(slugifyProductId("  Premium Cotton T-Shirt!  ")).toBe(
      "premium-cotton-t-shirt"
    );
  });

  it("truncates to 64 characters", () => {
    expect(slugifyProductId("a".repeat(100))).toHaveLength(64);
  });

  it("falls back to a generated id when nothing survives slugification", () => {
    expect(slugifyProductId("!!!___!!!")).toMatch(/^product-\d+$/);
    expect(slugifyProductId("日本語")).toMatch(/^product-\d+$/);
  });
});
