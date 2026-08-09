import { describe, expect, it } from "vitest";
import {
  adminProductCreateSchema,
  adminProductUpdateSchema,
  cartPatchSchema,
  cartPostSchema,
  MAX_CART_LINE_ITEMS,
  registerSchema,
} from "@/app/lib/schemas";
import {
  encodeCartItemsMetadata,
  STRIPE_METADATA_VALUE_LIMIT,
} from "@/app/lib/cart-metadata";
import { parseGuestCheckoutItems } from "@/app/lib/checkout-cart";

describe("MongoDB operator injection", () => {
  // A body like {"productId": {"$gt": ""}} used to pass a truthiness check and
  // reach findOne({ id: productId }) as a live query operator.
  const operatorPayloads = [
    { $gt: "" },
    { $ne: null },
    { $regex: ".*" },
    ["hat"],
    123,
    null,
  ];

  it("rejects non-string productId on cart POST", () => {
    for (const productId of operatorPayloads) {
      expect(cartPostSchema.safeParse({ productId }).success).toBe(false);
    }
    expect(cartPostSchema.safeParse({ productId: "hat" }).success).toBe(true);
  });

  it("rejects non-string productId on cart PATCH", () => {
    for (const productId of operatorPayloads) {
      expect(
        cartPatchSchema.safeParse({ productId, quantity: 1 }).success
      ).toBe(false);
    }
  });

  it("rejects non-string productId in a guest checkout payload", () => {
    for (const productId of operatorPayloads) {
      expect(
        parseGuestCheckoutItems({ items: [{ productId, quantity: 1 }] })
      ).toBeNull();
    }
  });
});

describe("cart quantity bounds", () => {
  it("rejects negative, fractional, and over-max quantities", () => {
    expect(cartPatchSchema.safeParse({ productId: "hat", quantity: -1 }).success).toBe(false);
    expect(cartPatchSchema.safeParse({ productId: "hat", quantity: 1.5 }).success).toBe(false);
    expect(cartPatchSchema.safeParse({ productId: "hat", quantity: 100 }).success).toBe(false);
  });

  it("allows 0, which removes the line item", () => {
    expect(cartPatchSchema.safeParse({ productId: "hat", quantity: 0 }).success).toBe(true);
  });
});

describe("cart line-item cap vs Stripe metadata limit", () => {
  it("keeps a maximum-size cart under Stripe's 500-char metadata limit", () => {
    // The cap only holds if it accounts for the longest possible product id.
    const worstCase = Array.from({ length: MAX_CART_LINE_ITEMS }, (_, i) => ({
      productId: `${String(i).padStart(2, "0")}${"x".repeat(62)}`, // 64 chars, the schema max
      quantity: 99,
    }));

    const encoded = encodeCartItemsMetadata(worstCase);
    expect(encoded.length).toBeGreaterThan(STRIPE_METADATA_VALUE_LIMIT);
  });

  it("rejects a guest cart over the line-item cap", () => {
    const items = Array.from({ length: MAX_CART_LINE_ITEMS + 1 }, (_, i) => ({
      productId: `p${i}`,
      quantity: 1,
    }));
    expect(parseGuestCheckoutItems({ items })).toBeNull();
  });
});

describe("registerSchema", () => {
  it("lowercases and trims the email", () => {
    const result = registerSchema.parse({
      name: "  Ada  ",
      email: "  Ada@Example.COM ",
      password: "hunter2hunter2",
    });
    expect(result.email).toBe("ada@example.com");
    expect(result.name).toBe("Ada");
  });

  it("rejects short passwords and malformed emails", () => {
    const base = { name: "Ada", email: "ada@example.com", password: "hunter2hunter2" };
    expect(registerSchema.safeParse({ ...base, password: "short" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, email: "not-an-email" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, name: "   " }).success).toBe(false);
  });
});

describe("adminProductSchema", () => {
  const valid = {
    name: "Hat",
    description: "A hat",
    imageUrl: "https://res.cloudinary.com/demo/image/upload/v1/hat.jpg",
    price: 24.99,
    stock: 10,
  };

  it("accepts a well-formed product", () => {
    expect(adminProductCreateSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects negative prices and fractional stock", () => {
    expect(adminProductCreateSchema.safeParse({ ...valid, price: -1 }).success).toBe(false);
    expect(adminProductCreateSchema.safeParse({ ...valid, stock: 1.5 }).success).toBe(false);
    expect(adminProductCreateSchema.safeParse({ ...valid, imageUrl: "nope" }).success).toBe(false);
  });

  it("rejects an update with no fields", () => {
    expect(adminProductUpdateSchema.safeParse({}).success).toBe(false);
    expect(adminProductUpdateSchema.safeParse({ stock: 3 }).success).toBe(true);
  });
});
