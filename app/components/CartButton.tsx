"use client";

import Link from "next/link";
import { useCartStore } from "../lib/store/cartStore";

/**
 * Cart entry point, shown at every breakpoint beside the auth controls.
 *
 * The count is deliberately not rendered until the store has rehydrated:
 * a guest cart lives in localStorage, so the server has no way to know it,
 * and painting a badge on the first client render causes a hydration
 * mismatch and a visible flicker.
 */
export default function CartButton({ active }: { active: boolean }) {
  const totalItems = useCartStore((s) => s.getTotalItems());
  const hydrated = useCartStore.persist?.hasHydrated() ?? true;
  const count = hydrated ? totalItems : 0;

  return (
    <Link
      href="/cart"
      aria-label={count > 0 ? `Cart, ${count} items` : "Cart"}
      className={`relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
        active
          ? "text-blue-600 bg-blue-50"
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
      }`}
    >
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>

      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-xs font-semibold text-white"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
