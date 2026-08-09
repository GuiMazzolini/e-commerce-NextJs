import type { NextConfig } from "next";

/**
 * Content Security Policy.
 *
 * Shipped in report-only mode: Next injects inline bootstrap scripts, so a
 * blocking policy needs a per-request nonce (which requires middleware) or
 * 'unsafe-inline'. Watch the browser console for violations, then promote the
 * header name to "Content-Security-Policy" once it is clean.
 *
 * `img-src` must stay in sync with ALLOWED_IMAGE_HOSTS in app/lib/admin.ts
 * and `images.remotePatterns` below.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' https://res.cloudinary.com data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://api.cloudinary.com",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  { key: "Content-Security-Policy-Report-Only", value: contentSecurityPolicy },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
