"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/app/lib/store/cartStore";

/**
 * Starts a Stripe Checkout session and redirects to the hosted page.
 *
 * There is no intermediate review page: Stripe's own checkout already lists
 * the line items and collects email and shipping, so an extra confirmation
 * step would show the buyer the same cart a third time.
 *
 * Authenticated carts live in MongoDB and the server reads them directly;
 * guests send their local cart, which the server re-prices against the
 * catalog before creating the session.
 */
export function useCheckout() {
  const { status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    const isGuest = status === "unauthenticated";

    // Read at call time rather than closing over a render-time snapshot, so
    // "Buy Now" sees the item it just added.
    const cartProducts = useCartStore.getState().cartProducts;

    if (isGuest && cartProducts.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        credentials: "include",
        headers: isGuest ? { "Content-Type": "application/json" } : undefined,
        body: isGuest
          ? JSON.stringify({
              items: cartProducts.map((p) => ({
                productId: p.id,
                quantity: p.quantity || 1,
              })),
            })
          : undefined,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Checkout failed");
        return;
      }
      if (typeof data.url === "string" && data.url) {
        window.location.href = data.url;
        return;
      }
      setError("No checkout URL returned");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return { startCheckout, loading, error, clearError: () => setError(null) };
}
