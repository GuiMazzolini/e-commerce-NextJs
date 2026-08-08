import { describe, expect, it } from "vitest";
import {
  clampCartQuantity,
  getAvailableStock,
  MAX_CART_QUANTITY,
} from "@/app/lib/cart-limits";
import {
  decodeCartItemsMetadata,
  encodeCartItemsMetadata,
} from "@/app/lib/cart-metadata";
import {
  getCartStockError,
  parseGuestCheckoutItems,
} from "@/app/lib/checkout-cart";
import { getShippingCost } from "@/app/lib/shipping";

describe("cart quantity limits", () => {
  it("clamps quantities to stock and the global max", () => {
    expect(clampCartQuantity(5, 3)).toBe(3);
    expect(clampCartQuantity(200)).toBe(MAX_CART_QUANTITY);
    expect(clampCartQuantity(0, 10)).toBe(0);
    expect(clampCartQuantity(2, 0)).toBe(0);
  });

  it("normalizes invalid stock values to zero", () => {
    expect(getAvailableStock(undefined)).toBe(0);
    expect(getAvailableStock(-4)).toBe(0);
    expect(getAvailableStock(7.9)).toBe(7);
  });
});

describe("guest checkout cart parsing", () => {
  it("accepts a valid guest items payload", () => {
    expect(
      parseGuestCheckoutItems({
        items: [
          { productId: "hat", quantity: 2 },
          { productId: "mug", quantity: 1 },
        ],
      })
    ).toEqual([
      { productId: "hat", quantity: 2 },
      { productId: "mug", quantity: 1 },
    ]);
  });

  it("rejects empty or malformed guest carts", () => {
    expect(parseGuestCheckoutItems({})).toBeNull();
    expect(parseGuestCheckoutItems({ items: [] })).toBeNull();
    expect(
      parseGuestCheckoutItems({ items: [{ productId: "hat", quantity: 1.5 }] })
    ).toBeNull();
    expect(
      parseGuestCheckoutItems({ items: [{ productId: "", quantity: 1 }] })
    ).toBeNull();
  });
});

describe("checkout stock validation", () => {
  const catalog = [
    { id: "hat", name: "Hat", stock: 2 },
    { id: "mug", name: "Mug", stock: 0 },
  ];

  it("allows quantities within stock", () => {
    expect(
      getCartStockError([{ productId: "hat", quantity: 2 }], catalog)
    ).toBeNull();
  });

  it("blocks overselling and out-of-stock items", () => {
    expect(
      getCartStockError([{ productId: "hat", quantity: 3 }], catalog)
    ).toBe("Only 2 of Hat left in stock");

    expect(
      getCartStockError([{ productId: "mug", quantity: 1 }], catalog)
    ).toBe("Mug is out of stock");
  });
});

describe("stripe cart metadata round-trip", () => {
  it("encodes and decodes product quantities for fulfillment", () => {
    const encoded = encodeCartItemsMetadata([
      { productId: "hat", quantity: 2 },
      { productId: "shirt", quantity: 1 },
    ]);
    expect(encoded).toBe("hat:2,shirt:1");
    expect(decodeCartItemsMetadata(encoded)).toEqual([
      { productId: "hat", quantity: 2 },
      { productId: "shirt", quantity: 1 },
    ]);
  });
});

describe("shipping", () => {
  it("applies free shipping at the threshold", () => {
    expect(getShippingCost(49.99)).toBe(5);
    expect(getShippingCost(50)).toBe(0);
  });
});
