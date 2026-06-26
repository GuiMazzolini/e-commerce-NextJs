# StyleShop — Full-Stack E-commerce Demo

A portfolio-ready e-commerce app with product browsing, authenticated cart management, and Stripe Checkout payments.

**Repository:** [github.com/GuiMazzolini/e-commerce-NextJs](https://github.com/GuiMazzolini/e-commerce-NextJs)

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS v4
- **Database:** MongoDB
- **Auth:** NextAuth.js (GitHub & Google OAuth)
- **Payments:** Stripe Checkout (hosted) + webhooks
- **State:** Zustand

## Features

- Product catalog with detail pages
- User authentication via GitHub or Google
- Persistent shopping cart (per user, stored in MongoDB)
- Stripe Checkout with server-validated line items
- Webhook clears cart after successful payment
- Responsive UI with sticky navbar and cart badge

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB Atlas cluster (or local MongoDB)
- GitHub and/or Google OAuth app credentials
- Stripe account (test mode is fine)

### 1. Clone and install

```bash
git clone https://github.com/GuiMazzolini/e-commerce-NextJs.git
cd e-commerce-NextJs
npm install
```

### 2. Environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

See `.env.example` for the full list. At minimum you need MongoDB credentials, NextAuth secret + OAuth keys, and Stripe keys.

### 3. Seed products (if your database is empty)

Insert product documents into the `products` collection in the `ecommerce-nextjs` database. Each document needs: `id`, `name`, `price`, `description`, `imageUrl` (filename in `public/`, e.g. `hat.jpg`).

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Stripe webhooks (local)

In a separate terminal, forward Stripe events to your local server:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the webhook signing secret (`whsec_...`) into `.env.local` as `STRIPE_WEBHOOK_SECRET`, then restart the dev server.

Use [Stripe test cards](https://docs.stripe.com/testing) (e.g. `4242 4242 4242 4242`) to complete a purchase.

## Project Structure

```
app/
├── api/
│   ├── auth/          # NextAuth routes
│   ├── cart/          # Cart CRUD
│   ├── checkout/      # Stripe session creation
│   ├── products/      # Product API
│   └── webhooks/      # Stripe webhook handler
├── cart/              # Shopping cart page
├── checkout/          # Checkout + success pages
├── components/        # NavBar, AuthButton, CartItem, ProductsList
├── lib/               # Stripe helper, cart store, API client
└── products/          # Product listing + detail pages
```

## Deploy

1. Push to GitHub and import the repo on [Vercel](https://vercel.com).
2. Add all environment variables from `.env.example` in the Vercel dashboard.
3. Set `NEXT_PUBLIC_APP_URL` to your production URL (e.g. `https://your-app.vercel.app`).
4. In Stripe Dashboard, add a webhook endpoint:
   `https://your-app.vercel.app/api/webhooks/stripe`
   with event `checkout.session.completed`.
5. Update OAuth redirect URLs in GitHub/Google to include your production domain.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Author

[GuiMazzolini](https://github.com/GuiMazzolini)
