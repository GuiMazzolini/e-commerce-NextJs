"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import AuthButton from "./AuthButton";
import CartButton from "./CartButton";

// The cart is not listed here — it lives beside the auth controls as an icon.
const links = [
  { href: "/products", label: "Products" },
  { href: "/orders", label: "Orders" },
];

function NavLink({
  href,
  label,
  active,
  onClick,
}: {
  href: string;
  label: string;
  active: boolean;
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
    </Link>
  );
}

function MobileNav({
  pathname,
  showAdmin,
}: {
  pathname: string;
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
              />
            </li>
          ))}
        </ul>

        <div className="relative flex items-center gap-1.5 sm:gap-2">
          <CartButton active={pathname === "/cart"} />
          <AuthButton />
          <MobileNav key={pathname} pathname={pathname} showAdmin={showAdmin} />
        </div>
      </div>
    </nav>
  );
}
