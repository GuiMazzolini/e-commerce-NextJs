export const FREE_SHIPPING_THRESHOLD = 50;
export const SHIPPING_FLAT_RATE = 5;

export function getShippingCost(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT_RATE;
}

export function getOrderTotal(subtotal: number): number {
  return subtotal + getShippingCost(subtotal);
}
