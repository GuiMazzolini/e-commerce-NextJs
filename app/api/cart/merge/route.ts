import { connectToDB } from "@/app/api/db";
import { authOptions } from "@/app/lib/auth";
import { clampCartQuantity, getAvailableStock } from "@/app/lib/cart-limits";
import {
  carts,
  products,
  type CartItemDoc,
  type ProductDoc,
} from "@/app/lib/db-collections";
import { parseBody } from "@/app/lib/api-request";
import { cartMergeSchema } from "@/app/lib/schemas";
import { enforceRateLimit, RATE_LIMITS } from "@/app/lib/rate-limit";
import type { Db } from "mongodb";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

async function buildCartProducts(db: Db, items: CartItemDoc[]) {
  if (!items.length) return [];
  const productIds = items.map((i) => i.productId);
  const productDocs = await products(db)
    .find({ id: { $in: productIds } })
    .toArray();

  return items
    .map((item) => {
      const product = productDocs.find((p) => p.id === item.productId);
      if (!product) return null;
      return {
        id: product.id,
        name: product.name,
        price: product.price,
        description: product.description,
        imageUrl: product.imageUrl,
        stock: getAvailableStock(product.stock),
        quantity: item.quantity,
      };
    })
    .filter(Boolean);
}

export async function POST(req: NextRequest) {
  const limited = await enforceRateLimit(
    req,
    "cart-merge",
    RATE_LIMITS.cartMerge.limit,
    RATE_LIMITS.cartMerge.windowSec
  );
  if (limited) return limited;

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = await parseBody(req, cartMergeSchema);
  if (!parsed.ok) return parsed.response;
  const incoming = parsed.data.items;

  const { db } = await connectToDB();
  const userId = session.user.email;

  const cart = await carts(db).findOne({ userId });
  const existing: CartItemDoc[] = cart?.items || [];

  const quantities = new Map<string, number>();
  for (const item of existing) {
    if (item?.productId) {
      quantities.set(item.productId, item.quantity || 0);
    }
  }
  for (const { productId, quantity } of incoming) {
    quantities.set(productId, (quantities.get(productId) || 0) + quantity);
  }

  const productIds = [...quantities.keys()];
  const productDocs = await products(db)
    .find({ id: { $in: productIds } })
    .toArray();
  const productsById = new Map<string, ProductDoc>(
    productDocs.map((p) => [p.id, p])
  );

  const mergedItems: CartItemDoc[] = [];
  for (const [productId, rawQty] of quantities.entries()) {
    const product = productsById.get(productId);
    if (!product) continue;
    const stock = getAvailableStock(product.stock);
    const quantity = clampCartQuantity(rawQty, stock);
    if (quantity >= 1) {
      mergedItems.push({ productId, quantity });
    }
  }

  await carts(db).updateOne(
    { userId },
    {
      $set: { items: mergedItems, updatedAt: new Date() },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true }
  );

  const cartProducts = await buildCartProducts(db, mergedItems);
  return NextResponse.json(cartProducts);
}
