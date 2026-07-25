"use client";

import { useEffect } from "react";
import { useCartStore } from "@/app/lib/store/cartStore";

/** Clears the local (and guest) cart after a successful payment. */
export default function ClearCartOnSuccess({ paid }: { paid: boolean }) {
  const clearGuestCart = useCartStore((s) => s.clearGuestCart);

  useEffect(() => {
    if (paid) {
      clearGuestCart();
    }
  }, [paid, clearGuestCart]);

  return null;
}
