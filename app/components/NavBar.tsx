'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AuthButton from './AuthButton';
import { useCartStore } from '../lib/store/cartStore';

const links = [
  { href: '/products', label: 'Products' },
  { href: '/cart', label: 'Cart' },
  { href: '/checkout', label: 'Checkout' },
];

export default function NavBar() {
  const pathname = usePathname();
  const totalItems = useCartStore((s) => s.getTotalItems());

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
          {links.map((link) => {
            const active = pathname === link.href;
            const isCart = link.href === '/cart';
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {link.label}
                  {isCart && totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-xs font-semibold text-white">
                      {totalItems}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <AuthButton />
      </div>
    </nav>
  );
}
