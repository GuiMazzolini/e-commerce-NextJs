/** Stripe's hard cap on the length of a single metadata value. */
export const STRIPE_METADATA_VALUE_LIMIT = 500;

/**
 * Comma-separated `productId:qty` pairs for Stripe session metadata (500-char limit).
 * Example: "hoodie:2,stickers:1"
 */
export function encodeCartItemsMetadata(
  items: { productId: string; quantity: number }[]
): string {
  return items.map((i) => `${i.productId}:${i.quantity}`).join(",");
}

export function decodeCartItemsMetadata(
  value: string | undefined | null
): { productId: string; quantity: number }[] {
  if (!value || typeof value !== "string") return [];

  return value
    .split(",")
    .map((part) => {
      const [productId, qtyRaw] = part.split(":");
      const quantity = Number(qtyRaw);
      if (!productId || !Number.isInteger(quantity) || quantity < 1) return null;
      return { productId, quantity };
    })
    .filter(Boolean) as { productId: string; quantity: number }[];
}
