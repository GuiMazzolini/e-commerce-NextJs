import { getAvailableStock } from "@/app/lib/cart-limits";
import { guestCheckoutSchema } from "@/app/lib/schemas";

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
 * Parse guest checkout payload items. Returns null if the shape is invalid,
 * the cart is empty, or it exceeds the line-item cap.
 */
export function parseGuestCheckoutItems(body: unknown): CartItem[] | null {
  const result = guestCheckoutSchema.safeParse(body);
  return result.success ? result.data.items : null;
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
