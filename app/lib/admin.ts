export function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS || "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.trim().toLowerCase());
}

/**
 * Hosts a product image may be served from. Must stay in sync with
 * `images.remotePatterns` in next.config.ts and the CSP `img-src` directive.
 */
export const ALLOWED_IMAGE_HOSTS = ["res.cloudinary.com"];

/**
 * Validate and normalize an admin-supplied product image URL.
 * Throws when the URL is unparseable, not https, or off the allowlist.
 */
export function normalizeProductImageUrl(imageUrl: string): string {
  const trimmed = imageUrl.trim();

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error("Image URL must be a valid absolute URL");
  }

  if (url.protocol !== "https:") {
    throw new Error("Image URL must use https");
  }
  if (!ALLOWED_IMAGE_HOSTS.includes(url.hostname)) {
    throw new Error(
      `Image URL host must be one of: ${ALLOWED_IMAGE_HOSTS.join(", ")}`
    );
  }

  return url.toString();
}

/** URL-safe product id from a display name. */
export function slugifyProductId(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return slug || `product-${Date.now()}`;
}
