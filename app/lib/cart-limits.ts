/** Max units of a single product allowed in a cart (guest or authenticated). */
export const MAX_CART_QUANTITY = 99;

/** Clamp a quantity into [1, max], where max is min(MAX_CART_QUANTITY, stock?). Returns 0 for invalid/non-positive. */
export function clampCartQuantity(quantity: number, stock?: number): number {
  if (!Number.isFinite(quantity) || quantity < 1) return 0;

  let max = MAX_CART_QUANTITY;
  if (typeof stock === "number" && Number.isFinite(stock)) {
    max = Math.min(max, Math.max(0, Math.floor(stock)));
  }
  if (max < 1) return 0;

  return Math.min(Math.floor(quantity), max);
}

export function getAvailableStock(stock: unknown): number {
  if (typeof stock !== "number" || !Number.isFinite(stock) || stock < 0) return 0;
  return Math.floor(stock);
}
