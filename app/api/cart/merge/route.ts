import { connectToDB } from "@/app/api/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

type CartItem = { productId: string; quantity: number };
type DBProduct = {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
};

async function buildCartProducts(
  db: Awaited<ReturnType<typeof connectToDB>>["db"],
  items: CartItem[]
) {
  if (!items.length) return [];
  const productIds = items.map((i) => i.productId);
  const productDocs = await db
    .collection("products")
    .find({ id: { $in: productIds } })
    .toArray();

  return items
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
    .filter(Boolean);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const incoming: unknown = body?.items;
  if (!Array.isArray(incoming)) {
    return NextResponse.json({ error: "items array is required" }, { status: 400 });
  }

  const { db } = await connectToDB();
  const userId = session.user.email;

  const cart = await db.collection("carts").findOne({ userId });
  const existing: CartItem[] = cart?.items || [];

  const quantities = new Map<string, number>();
  for (const item of existing) {
    if (item?.productId) {
      quantities.set(item.productId, item.quantity || 0);
    }
  }
  for (const item of incoming as CartItem[]) {
    const productId = item?.productId;
    const quantity = Number(item?.quantity);
    if (!productId || !Number.isFinite(quantity) || quantity <= 0) continue;
    quantities.set(productId, (quantities.get(productId) || 0) + quantity);
  }

  const productIds = [...quantities.keys()];
  const productDocs = await db
    .collection("products")
    .find({ id: { $in: productIds } })
    .toArray();
  const validIds = new Set(productDocs.map((p: DBProduct) => p.id));

  const mergedItems: CartItem[] = [...quantities.entries()]
    .filter(([productId]) => validIds.has(productId))
    .map(([productId, quantity]) => ({ productId, quantity }));

  await db.collection("carts").updateOne(
    { userId },
    {
      $set: { items: mergedItems, updatedAt: new Date() },
      $setOnInsert: { userId, createdAt: new Date() },
    },
    { upsert: true }
  );

  const cartProducts = await buildCartProducts(db, mergedItems);
  return NextResponse.json(cartProducts);
}
