import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDB } from "@/app/api/db";
import ShoppingCartList from "./ShoppingCartList";
import { redirect } from "next/navigation";

type CartItem = { productId: string; quantity: number };
type DBProduct = { id: string; name: string; price: number; description: string; imageUrl: string };

export default async function CartPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/api/auth/signin");

  const { db } = await connectToDB();

  const cart = await db.collection("carts").findOne({ userId: session.user?.email });
  const items: CartItem[] = cart?.items || [];

  let cartProducts: (DBProduct & { quantity: number })[] = [];

  if (items.length > 0) {
    const productIds = items.map((i) => i.productId);
    const productDocs = await db
      .collection("products")
      .find({ id: { $in: productIds } })
      .toArray();

    cartProducts = items
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
  }

  return <ShoppingCartList initialCartProducts={cartProducts} />;
}