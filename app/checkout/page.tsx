import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDB } from "@/app/api/db";
import { redirect } from "next/navigation";
import CheckoutClient from "./CheckoutClient";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Securely complete your StyleShop purchase with Stripe.",
};

type CartItem = { productId: string; quantity: number };
type DBProduct = {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
};

export default async function CheckoutPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/api/auth/signin?callbackUrl=/checkout");
  }

  const { db } = await connectToDB();
  const cart = await db.collection("carts").findOne({ userId: session.user.email });
  const items: CartItem[] = cart?.items || [];

  if (items.length === 0) {
    redirect("/cart");
  }

  const productIds = items.map((i) => i.productId);
  const productDocs = await db
    .collection("products")
    .find({ id: { $in: productIds } })
    .toArray();

  const cartProducts = items
    .map((item) => {
      const product = productDocs.find((p: DBProduct) => p.id === item.productId);
      if (!product) return null;
      return {
        id: product.id,
        name: product.name,
        price: product.price,
        description: product.description,
        imageUrl: product.imageUrl,
        quantity: item.quantity,
      };
    })
    .filter(Boolean) as (DBProduct & { quantity: number })[];

  if (cartProducts.length === 0) {
    redirect("/cart");
  }

  return <CheckoutClient initialCartProducts={cartProducts} />;
}
