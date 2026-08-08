import { clampCartQuantity, getAvailableStock } from "@/app/lib/cart-limits";

export type CartItem = { productId: string; quantity: number };

export type StockCheckedProduct = {
  id: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  stock: number;
  quantity: number;
};

/**
 * Parse guest checkout payload items. Returns null if the shape is invalid
 * or the cart would be empty after clamping.
 */
export function parseGuestCheckoutItems(body: unknown): CartItem[] | null {
  if (!body || typeof body !== "object" || !("items" in body)) return null;
  const items = (body as { items: unknown }).items;
  if (!Array.isArray(items) || items.length === 0) return null;

  const parsed: CartItem[] = [];
  for (const item of items) {
    if (!item || typeof item !== "object") return null;
    const { productId, quantity } = item as Record<string, unknown>;
    if (typeof productId !== "string" || !productId) return null;
    if (typeof quantity !== "number" || !Number.isInteger(quantity)) return null;
    const clamped = clampCartQuantity(quantity);
    if (clamped < 1) return null;
    parsed.push({ productId, quantity: clamped });
  }
  return parsed;
}

/**
 * Validate requested quantities against product stock.
 * Returns a user-facing error string, or null when the cart is stock-safe.
 */
export function getCartStockError(
  items: CartItem[],
  products: { id: string; name: string; stock?: number }[]
): string | null {
  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) continue;

    const stock = getAvailableStock(product.stock);
    if (item.quantity > stock) {
      return stock < 1
        ? `${product.name} is out of stock`
        : `Only ${stock} of ${product.name} left in stock`;
    }
  }
  return null;
}

/**
 * Attach quantities to found products and skip missing product ids.
 * Call getCartStockError first (or use this after a null stock error).
 */
export function attachQuantitiesToProducts(
  items: CartItem[],
  products: { id: string; name: string; price: number; description?: string; imageUrl?: string; stock?: number }[]
): StockCheckedProduct[] {
  const result: StockCheckedProduct[] = [];
  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) continue;
    result.push({
      id: product.id,
      name: product.name,
      price: product.price,
      description: product.description,
      imageUrl: product.imageUrl,
      stock: getAvailableStock(product.stock),
      quantity: item.quantity,
    });
  }
  return result;
}
