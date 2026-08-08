import { connectToDB } from "@/app/api/db";
import { isAdminEmail, normalizeProductImageUrl } from "@/app/lib/admin";
import { authOptions } from "@/app/lib/auth";
import { getAvailableStock } from "@/app/lib/cart-limits";
import { products, type ProductDoc } from "@/app/lib/db-collections";
import { badRequest, parseBody } from "@/app/lib/api-request";
import { adminProductUpdateSchema } from "@/app/lib/schemas";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

type Params = { id: string };

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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { db } = await connectToDB();
  const product = await products(db).findOne({ id });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json(serializeProduct(product));
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parsed = await parseBody(req, adminProductUpdateSchema);
  if (!parsed.ok) return parsed.response;

  const updates: Partial<ProductDoc> & { updatedAt: Date } = {
    updatedAt: new Date(),
  };

  const { name, description, imageUrl, price, stock } = parsed.data;
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (price !== undefined) updates.price = price;
  if (stock !== undefined) updates.stock = stock;
  if (imageUrl !== undefined) {
    try {
      updates.imageUrl = normalizeProductImageUrl(imageUrl);
    } catch (err) {
      return badRequest(err instanceof Error ? err.message : "Invalid image URL");
    }
  }

  const { db } = await connectToDB();
  const updated = await products(db).findOneAndUpdate(
    { id },
    { $set: updates },
    { returnDocument: "after" }
  );

  if (!updated) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json(serializeProduct(updated));
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { db } = await connectToDB();
  const result = await products(db).deleteOne({ id });
  if (result.deletedCount === 0) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
