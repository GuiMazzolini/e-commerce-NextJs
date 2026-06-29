"use client";

import { useCartStore } from "../lib/store/cartStore";

export default function CartErrorBanner() {
  const cartError = useCartStore((s) => s.cartError);
  const clearCartError = useCartStore((s) => s.clearCartError);

  if (!cartError) return null;

  return (
    <div
      role="alert"
      className="mb-6 flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
    >
      <span>{cartError}</span>
      <button
        type="button"
        onClick={clearCartError}
        className="shrink-0 font-semibold hover:text-red-900"
        aria-label="Dismiss error"
      >
        ×
      </button>
    </div>
  );
}
