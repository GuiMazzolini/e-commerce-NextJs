import { connectToDB } from "@/app/api/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { getAvailableStock, MAX_CART_QUANTITY } from "@/app/lib/cart-limits";
import { carts, products, type CartItemDoc, type ProductDoc } from "@/app/lib/db-collections";
import { parseBody, unauthorized } from "@/app/lib/api-request";
import {
  cartDeleteSchema,
  cartPatchSchema,
  cartPostSchema,
} from "@/app/lib/schemas";
import type { Db } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

/** The cart is keyed by email, so a session without one cannot own a cart. */
async function getUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.email ?? null;
}

function serializeCartProduct(product: ProductDoc, quantity: number) {
  const stock = getAvailableStock(product.stock);
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    description: product.description,
    imageUrl: product.imageUrl,
    stock,
    quantity,
  };
}

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
      return serializeCartProduct(product, item.quantity);
    })
    .filter(Boolean);
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const { db } = await connectToDB();
  const cart = await carts(db).findOne({ userId });
  const cartProducts = await buildCartProducts(db, cart?.items || []);

  return NextResponse.json(cartProducts);
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const parsed = await parseBody(req, cartPostSchema);
  if (!parsed.ok) return parsed.response;
  const { productId } = parsed.data;

  const { db } = await connectToDB();

  const product = await products(db).findOne({ id: productId });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const stock = getAvailableStock(product.stock);
  if (stock < 1) {
    return NextResponse.json({ error: "Out of stock" }, { status: 409 });
  }

  const cart = await carts(db).findOne({ userId });
  const existingItem = cart?.items?.find((i) => i.productId === productId);

  let updatedCart;
  if (existingItem) {
    if (existingItem.quantity >= stock) {
      return NextResponse.json(
        { error: `Only ${stock} in stock` },
        { status: 409 }
      );
    }
    const nextQuantity = Math.min(existingItem.quantity + 1, MAX_CART_QUANTITY, stock);
    updatedCart = await carts(db).findOneAndUpdate(
      { userId, "items.productId": productId },
      { $set: { "items.$.quantity": nextQuantity, updatedAt: new Date() } },
      { returnDocument: "after" }
    );
  } else {
    updatedCart = await carts(db).findOneAndUpdate(
      { userId },
      {
        $push: { items: { productId, quantity: 1 } },
        $set: { updatedAt: new Date() },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true, returnDocument: "after" }
    );
  }

  const cartProducts = await buildCartProducts(db, updatedCart?.items || []);
  return NextResponse.json(cartProducts, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const parsed = await parseBody(req, cartPatchSchema);
  if (!parsed.ok) return parsed.response;
  const { productId, quantity } = parsed.data;

  const { db } = await connectToDB();

  let updatedCart;
  if (quantity === 0) {
    updatedCart = await carts(db).findOneAndUpdate(
      { userId },
      { $pull: { items: { productId } }, $set: { updatedAt: new Date() } },
      { returnDocument: "after" }
    );
    if (!updatedCart)
      return NextResponse.json({ error: "Item not found in cart" }, { status: 404 });
  } else {
    const product = await products(db).findOne({ id: productId });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const stock = getAvailableStock(product.stock);
    if (stock < 1) {
      return NextResponse.json({ error: "Out of stock" }, { status: 409 });
    }
    if (quantity > stock) {
      return NextResponse.json(
        { error: `Only ${stock} in stock` },
        { status: 409 }
      );
    }

    updatedCart = await carts(db).findOneAndUpdate(
      { userId, "items.productId": productId },
      { $set: { "items.$.quantity": quantity, updatedAt: new Date() } },
      { returnDocument: "after" }
    );
    if (!updatedCart)
      return NextResponse.json({ error: "Item not found in cart" }, { status: 404 });
  }

  const cartProducts = await buildCartProducts(db, updatedCart?.items || []);
  return NextResponse.json(cartProducts);
}

export async function DELETE(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const parsed = await parseBody(req, cartDeleteSchema);
  if (!parsed.ok) return parsed.response;
  const { productId } = parsed.data;

  const { db } = await connectToDB();

  const updatedCart = await carts(db).findOneAndUpdate(
    { userId },
    { $pull: { items: { productId } }, $set: { updatedAt: new Date() } },
    { returnDocument: "after" }
  );

  const cartProducts = await buildCartProducts(db, updatedCart?.items || []);
  return NextResponse.json(cartProducts);
}
