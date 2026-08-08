# StyleShop — Code Review

Reviewed at `10f5094`, updated after the P0 remediation pass.
Verified by running: `npm run typecheck`, `npm test`, `npm run lint`, `npm run build`, `npm audit`, plus runtime checks against a live MongoDB.

## Status

| Gate | At review | Now |
|---|---|---|
| `npm run typecheck` | 13 errors | **0** |
| `npm run build` | ❌ failed | **✅ passes** |
| `npm test` | 17 pass | **42 pass** (6 files) |
| `npm run lint` | clean | clean |
| `npm audit` | 12 vulns, 2 critical | **0** |

**Fixed:** broken build (typed Mongo collections), `next` 16.0.4→16.3.0 + `next-auth` 4.24.15 (cleared a CVSS 10.0 RCE and an OAuth cookie-binding flaw), NoSQL operator injection (Zod on every route), rate limiting, unauthenticated writes on `/checkout/success`, cross-tenant cart wipe, security headers, unique DB indexes, image-host allowlist, order-email case sensitivity, Stripe metadata overflow.

Nothing critical or high is open. Everything below is quality and hardening work.

---

## What's left

### P1 — worth doing next

**1. The cart join is duplicated 4×.**
`app/api/cart/route.ts`, `app/api/cart/merge/route.ts`, `app/cart/page.tsx`, `app/checkout/page.tsx` each rebuild "fetch products by id → attach quantities → normalize stock." Extract `loadCartProducts(db, items)` into `app/lib/cart-server.ts`. Highest-value refactor in the codebase: ~100 lines deleted, one place to test.

Same pattern, smaller: `requireAdmin` and `serializeProduct` are copy-pasted between the two admin route files.

**2. No route-handler or component tests.** All 42 tests cover `app/lib/` pure functions. Zero coverage of the 8 route handlers (including every authorization check) and 20 components. Biggest gap: handler tests. App Router handlers are plain functions — call them directly with a `Request` and mock `getServerSession`. Priority cases: 401s on every cart verb, admin routes reject non-admins, checkout ignores a client-supplied price, webhook rejects a bad signature.

Needs `vitest.config.mts` changes for components: `environment: "jsdom"`, `include: ["app/**/*.test.{ts,tsx}"]`, plus `@testing-library/react`.

**3. Two non-selector store subscriptions.**
`ProductsList.tsx:14` and `ProductDetail.tsx:19` destructure the whole store, so every `loading[productId]` toggle re-renders the entire product grid. Everywhere else already uses selectors correctly.

**4. `CartItem.tsx` is missing `"use client"`.** Works only because a client component imports it. Any Server Component importing it breaks. One line.

### P2 — polish

- **Wrong GitHub URL.** `app/page.tsx:6` and the README point at `github.com/GuiMazzolini/e-commerce-NextJs`, and the README credits `GuiMazzolini`. Every "Inspect the code" button sends visitors to someone else's repo.
- **Dead API routes.** `/api/products` and `/api/products/[id]` are unused (nothing fetches them) and return raw Mongo docs including `_id`. `GET /api/admin/products` is also unused. Delete or align them.
- **Inline Tailwind duplication.** The primary-button class string appears in ~9 files with drift (`px-6` vs `px-8`, etc.). Three components — `<Button>`, `<Card>`, `<Input>` — plus `clsx` would fix it. Note `ProductsList.tsx:216` has `${loading && "..."}`, which renders the string `"false"` into `className`.
- **Two large files.** `ProductForm.tsx` (395 lines — split out the upload field and a `useProductForm` hook) and `app/page.tsx` (361 lines of marketing markup — extract `<Hero>`, `<CaseStudy>`, `<Featured>`, `<CTA>`).
- **`unoptimized` on all 6 `<Image>` call sites** bypasses Next's optimizer and `srcset`. Mobile downloads a 1200px asset for a 96px thumbnail. Either drop the flag or add a Cloudinary loader so `sizes` produces a real srcset.
- **Money as floats.** Rounding at the Stripe boundary is correct, so no charge is wrong today, but subtotals accumulate in floats before the free-shipping comparison. Store integer cents.
- **One `error.tsx` at root only.** Add per-segment boundaries for `products/`, `cart/`, `orders/`, `admin/` — `loading.tsx` coverage is already good, mirror it.
- **No Prettier/Husky.** Formatting drifts (`app/api/products/*` is 4-space, everything else 2-space). Add Prettier + lint-staged so the CI typecheck gate isn't the first thing to catch a mistake.
- **No error tracking.** 8 `console.error`/`warn` calls go nowhere. The `console.warn` at `orders.ts` (stock decrement skipped on a *paid* order) is money-affecting and should alert. Add Sentry.
- **Stock isn't reserved**, only validated at checkout and decremented after payment. Two buyers can both pass validation for the last unit; the `$gte` guard prevents negative stock, so the second is charged for something that won't ship. Acceptable for a demo, but `Order.status` is the literal `"paid"` and can't represent it — add `"needs_review"` and alert.

---

## Deployment notes

- **CSP ships as report-only.** Check the browser console for violations, then rename the header to `Content-Security-Policy`.
- **The unique indexes will fail to build against a database that already has duplicate emails or product ids.** Check and dedupe before deploying.
- **Leave `STRIPE_WEBHOOK_SECRET` unset in local dev** unless `stripe listen` is running — it now decides whether the webhook or the success page fulfills orders.
