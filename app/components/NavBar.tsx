"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import AuthButton from "./AuthButton";
import { useCartStore } from "../lib/store/cartStore";

const links = [
  { href: "/products", label: "Products" },
  { href: "/cart", label: "Cart" },
  { href: "/orders", label: "Orders" },
];

function NavLink({
  href,
  label,
  active,
  badge,
  onClick,
}: {
  href: string;
  label: string;
  active: boolean;
  badge?: number;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`relative block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? "text-blue-600 bg-blue-50"
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
      }`}
    >
      {label}
      {badge != null && badge > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-xs font-semibold text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}

function MobileNav({
  pathname,
  totalItems,
  showAdmin,
}: {
  pathname: string;
  totalItems: number;
  showAdmin: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navLinks = showAdmin
    ? [...links, { href: "/admin/products", label: "Admin" }]
    : links;

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <button
        type="button"
        className="sm:hidden flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {menuOpen && (
        <>
          <button
            type="button"
            className="sm:hidden fixed inset-0 top-16 bg-black/20"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <div className="sm:hidden fixed left-0 right-0 top-16 border-t border-gray-200 bg-white shadow-lg z-40">
            <ul className="container mx-auto px-4 py-3 space-y-1">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <NavLink
                    href={link.href}
                    label={link.label}
                    active={
                      pathname === link.href || pathname.startsWith(link.href + "/")
                    }
                    badge={link.href === "/cart" ? totalItems : undefined}
                    onClick={() => setMenuOpen(false)}
                  />
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </>
  );
}

export default function NavBar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const totalItems = useCartStore((s) => s.getTotalItems());
  const showAdmin = !!session?.user?.isAdmin;
  const navLinks = showAdmin
    ? [...links, { href: "/admin/products", label: "Admin" }]
    : links;

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

        <ul className="hidden sm:flex items-center gap-1">
          {navLinks.map((link) => (
            <li key={link.href}>
              <NavLink
                href={link.href}
                label={link.label}
                active={
                  pathname === link.href || pathname.startsWith(link.href + "/")
                }
                badge={link.href === "/cart" ? totalItems : undefined}
              />
            </li>
          ))}
        </ul>

        <div className="relative flex items-center gap-2">
          <Link
            href="/cart"
            className="relative sm:hidden flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Cart"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-xs font-semibold text-white">
                {totalItems}
              </span>
            )}
          </Link>
          <AuthButton />
          <MobileNav
            key={pathname}
            pathname={pathname}
            totalItems={totalItems}
            showAdmin={showAdmin}
          />
        </div>
      </div>
    </nav>
  );
}
