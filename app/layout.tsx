import type { Metadata } from 'next';
import './globals.css';
import NavBar from './components/NavBar';
import Providers from './providers';

export const metadata: Metadata = {
  title: {
    default: 'StyleShop — Full-Stack E-commerce Case Study',
    template: '%s | StyleShop',
  },
  description:
    'A production-style e-commerce demo built with Next.js, MongoDB, Stripe, and Resend. Explore guest checkout, inventory, admin, and order confirmation email.',
  openGraph: {
    title: 'StyleShop — Full-Stack E-commerce Case Study',
    description:
      'A production-style e-commerce demo built with Next.js, MongoDB, Stripe, and Resend.',
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
