import { Product } from "../../product-data";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export class CartRequestError extends Error {
  status: number;
  constructor(status: number) {
    super(`Cart request failed: ${status}`);
    this.name = "CartRequestError";
    this.status = status;
  }
}

async function request(
  method: string,
  body?: unknown,
  path = "/api/cart"
): Promise<Product[]> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  if (!res.ok) {
    throw new CartRequestError(res.status);
  }

  return res.json();
}

export function fetchCartItems() {
  return request("GET");
}

export function addCartItem(productId: string) {
  return request("POST", { productId });
}

export function updateCartQuantity(productId: string, quantity: number) {
  return request("PATCH", { productId, quantity });
}

export function removeCartItem(productId: string) {
  return request("DELETE", { productId });
}

export function mergeGuestCart(
  items: { productId: string; quantity: number }[]
) {
  return request("POST", { items }, "/api/cart/merge");
}
