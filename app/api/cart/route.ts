import { connectToDB } from "@/app/api/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";

type CartItem = { productId: string; quantity: number };
type DBProduct = { id: string; name: string; price: number; description: string; imageUrl: string };

async function getSession() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  return session;
}

async function buildCartProducts(db: any, items: CartItem[]) {
  if (!items.length) return [];
  const productIds = items.map((i) => i.productId);
  const productDocs = await db
    .collection("products")
    .find({ id: { $in: productIds } })
    .toArray();

  return items
    .map((item) => {
      const product = productDocs.find((p: DBProduct) => p.id === item.productId);
      return product ? { ...product, quantity: item.quantity } : null;
    })
    .filter(Boolean);
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { db } = await connectToDB();
  const cart = await db.collection("carts").findOne({ userId: session.user?.email });
  const cartProducts = await buildCartProducts(db, cart?.items || []);

  return NextResponse.json(cartProducts);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { productId } = await req.json();
  if (!productId) return NextResponse.json({ error: "productId is required" }, { status: 400 });

  const { db } = await connectToDB();
  const userId = session.user?.email;

  const productExists = await db.collection("products").findOne({ id: productId });
  if (!productExists) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const cart = await db.collection("carts").findOne({ userId, "items.productId": productId });

  let updatedCart;
  if (cart) {
    updatedCart = await db.collection("carts").findOneAndUpdate(
      { userId, "items.productId": productId },
      { $inc: { "items.$.quantity": 1 }, $set: { updatedAt: new Date() } },
      { returnDocument: "after" }
    );
  } else {
    updatedCart = await db.collection("carts").findOneAndUpdate(
      { userId },
      {
        $push: { items: { productId, quantity: 1 } },
        $set: { updatedAt: new Date() },
        $setOnInsert: { userId, createdAt: new Date() },
      },
      { upsert: true, returnDocument: "after" }
    );
  }

  const cartProducts = await buildCartProducts(db, updatedCart?.items || []);
  return NextResponse.json(cartProducts, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { productId, quantity } = await req.json();
  if (!productId || quantity === undefined)
    return NextResponse.json({ error: "productId and quantity are required" }, { status: 400 });
  if (quantity < 0)
    return NextResponse.json({ error: "quantity cannot be negative" }, { status: 400 });

  const { db } = await connectToDB();
  const userId = session.user?.email;

  let updatedCart;
  if (quantity === 0) {
    updatedCart = await db.collection("carts").findOneAndUpdate(
      { userId },
      { $pull: { items: { productId } }, $set: { updatedAt: new Date() } },
      { returnDocument: "after" }
    );
  } else {
    updatedCart = await db.collection("carts").findOneAndUpdate(
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
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { productId } = await req.json();
  if (!productId) return NextResponse.json({ error: "productId is required" }, { status: 400 });

  const { db } = await connectToDB();
  const userId = session.user?.email;

  const updatedCart = await db.collection("carts").findOneAndUpdate(
    { userId },
    { $pull: { items: { productId } }, $set: { updatedAt: new Date() } },
    { returnDocument: "after" }
  );

  const cartProducts = await buildCartProducts(db, updatedCart?.items || []);
  return NextResponse.json(cartProducts);
}