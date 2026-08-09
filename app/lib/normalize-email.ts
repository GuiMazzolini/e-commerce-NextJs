/**
 * Emails are the user key across users, carts, and orders, so they are
 * normalized at every boundary — read, write, and comparison.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
