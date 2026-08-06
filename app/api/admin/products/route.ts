import { connectToDB } from "@/app/api/db";
import {
  isAdminEmail,
  normalizeProductImageUrl,
  slugifyProductId,
} from "@/app/lib/admin";
import { authOptions } from "@/app/lib/auth";
import { getAvailableStock } from "@/app/lib/cart-limits";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return null;
  }
  return session;
}

function serializeProduct(doc: Record<string, unknown>) {
  return {
    id: doc.id,
    name: doc.name,
    price: doc.price,
    description: doc.description,
    imageUrl: doc.imageUrl,
    stock: getAvailableStock(doc.stock),
  };
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { db } = await connectToDB();
  const products = await db.collection("products").find({}).sort({ name: 1 }).toArray();
  return NextResponse.json(products.map(serializeProduct));
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const imageUrl =
    typeof body.imageUrl === "string"
      ? normalizeProductImageUrl(body.imageUrl)
      : "";
  const price = Number(body.price);
  const stock = Number(body.stock);
  const id =
    typeof body.id === "string" && body.id.trim()
      ? slugifyProductId(body.id)
      : slugifyProductId(name);

  if (!name || !description || !imageUrl) {
    return NextResponse.json(
      { error: "name, description, and imageUrl are required" },
      { status: 400 }
    );
  }
  if (!Number.isFinite(price) || price < 0) {
    return NextResponse.json({ error: "price must be a non-negative number" }, { status: 400 });
  }
  if (!Number.isInteger(stock) || stock < 0) {
    return NextResponse.json({ error: "stock must be a non-negative integer" }, { status: 400 });
  }

  const { db } = await connectToDB();
  const existing = await db.collection("products").findOne({ id });
  if (existing) {
    return NextResponse.json({ error: "A product with this id already exists" }, { status: 409 });
  }

  const product = {
    id,
    name,
    description,
    imageUrl,
    price,
    stock,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.collection("products").insertOne(product);
  return NextResponse.json(serializeProduct(product), { status: 201 });
}
