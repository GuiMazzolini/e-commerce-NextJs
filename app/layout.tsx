import type { Metadata } from 'next';
import './globals.css';
import NavBar from './components/NavBar';
import Providers from './providers';

export const metadata: Metadata = {
  title: {
    default: 'StyleShop — Modern E-commerce Demo',
    template: '%s | StyleShop',
  },
  description:
    'A full-stack e-commerce demo built with Next.js, MongoDB, NextAuth, and Stripe Checkout. Browse products, manage a cart, and pay securely.',
  openGraph: {
    title: 'StyleShop — Modern E-commerce Demo',
    description:
      'A full-stack e-commerce demo built with Next.js, MongoDB, NextAuth, and Stripe Checkout.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <NavBar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
