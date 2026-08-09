"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthButton from "./AuthButton";
import CartButton from "./CartButton";

/**
 * Shop + cart sit in the center as the main browsing actions.
 * Account controls stay on the right.
 */
function NavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? "text-blue-600 bg-blue-50"
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
      }`}
    >
      {label}
    </Link>
  );
}

export default function NavBar() {
  const pathname = usePathname();
  const shopActive =
    pathname === "/products" || pathname.startsWith("/products/");

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-blue-600 to-purple-600 text-white font-bold text-lg shadow-sm">
            S
          </span>
          <span className="text-xl font-bold text-gray-900 tracking-tight">
            Style<span className="text-blue-600">Shop</span>
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <NavLink href="/products" label="Shop" active={shopActive} />
          <CartButton active={pathname === "/cart"} />
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Remounting on navigation is what closes the account menu. */}
          <AuthButton key={pathname} />
        </div>
      </div>
    </nav>
  );
}
