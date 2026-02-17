import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/app/api/db";

type Params = { id: string };
type CartBody = { productId: string; quantity?: number };
type CartItem = { productId: string; quantity: number };
type DBProduct = { 
  id: string; 
  name: string; 
  price: number; 
  description: string; 
  imageUrl: string;
  [key: string]: any; // For any other MongoDB fields
};

export async function GET(
  _request: NextRequest, 
  { params }: { params: Promise<Params> }
) {
  try {
    const { db } = await connectToDB();
    const { id } = await params;
    
    const userCart = await db.collection('carts').findOne({ userId: id });

    if (!userCart || !userCart.items?.length) {
      return NextResponse.json([], { status: 200 });
    }

    // Get all unique product IDs
    const productIds = userCart.items.map((item: CartItem) => item.productId);
    
    // Fetch products from database
    const products = await db
      .collection('products')
      .find({ id: { $in: productIds } })
      .toArray();

    // Combine products with quantities
    const cartProducts = userCart.items.map((item: CartItem) => {
      const product = products.find((p: DBProduct) => p.id === item.productId);
      return product ? { ...product, quantity: item.quantity } : null;
    }).filter(Boolean);

    return NextResponse.json(cartProducts);
  } catch (error) {
    console.error('GET /api/cart error:', error);
    return NextResponse.json(
      { error: "Failed to fetch cart" }, 
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest, 
  { params }: { params: Promise<Params> }
) {
  try {
    const { db } = await connectToDB();
    const { id } = await params;
    const body: CartBody = await request.json();
    const { productId, quantity = 1 } = body;

    if (!productId) {
      return NextResponse.json(
        { error: "productId is required" }, 
        { status: 400 }
      );
    }

    // Check if product exists
    const productExists = await db
      .collection('products')
      .findOne({ id: productId });
    
    if (!productExists) {
      return NextResponse.json(
        { error: "Product not found" }, 
        { status: 404 }
      );
    }

    // Check if item already in cart
    const userCart = await db.collection('carts').findOne({ userId: id });
    const existingItem = userCart?.items?.find(
      (item: CartItem) => item.productId === productId
    );

    let updatedCart;

    if (existingItem) {
      // Increment quantity if item exists
      updatedCart = await db.collection('carts').findOneAndUpdate(
        { userId: id, "items.productId": productId },
        { 
          $inc: { "items.$.quantity": quantity },
          $set: { updatedAt: new Date() }
        },
        { returnDocument: 'after' }
      );
    } else {
      // Add new item
      updatedCart = await db.collection('carts').findOneAndUpdate(
        { userId: id },
        { 
          $push: { items: { productId, quantity } },
          $setOnInsert: { userId: id, createdAt: new Date() },
          $set: { updatedAt: new Date() }
        },
        { upsert: true, returnDocument: 'after' }
      );
    }

    if (!updatedCart) {
      return NextResponse.json(
        { error: "Failed to update cart" }, 
        { status: 500 }
      );
    }

    // Fetch updated products with quantities
    const productIds = updatedCart.items.map((item: CartItem) => item.productId);
    const products = await db
      .collection('products')
      .find({ id: { $in: productIds } })
      .toArray();

    const cartProducts = updatedCart.items.map((item: CartItem) => {
      const product = products.find((p: DBProduct) => p.id === item.productId);
      return product ? { ...product, quantity: item.quantity } : null;
    }).filter(Boolean);

    return NextResponse.json(cartProducts, { status: 201 });
  } catch (error) {
    console.error('POST /api/cart error:', error);
    return NextResponse.json(
      { error: "Failed to add to cart" }, 
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest, 
  { params }: { params: Promise<Params> }
) {
  try {
    const { db } = await connectToDB();
    const { id } = await params;
    const body: CartBody = await request.json();
    const { productId, quantity } = body;

    if (!productId || quantity === undefined) {
      return NextResponse.json(
        { error: "productId and quantity are required" }, 
        { status: 400 }
      );
    }

    if (quantity < 0) {
      return NextResponse.json(
        { error: "quantity cannot be negative" }, 
        { status: 400 }
      );
    }

    // If quantity is 0, remove the item
    if (quantity === 0) {
      const updatedCart = await db.collection('carts').findOneAndUpdate(
        { userId: id },
        { 
          $pull: { items: { productId } },
          $set: { updatedAt: new Date() }
        },
        { returnDocument: 'after' }
      );

      if (!updatedCart) {
        return NextResponse.json([], { status: 200 });
      }

      const productIds = updatedCart.items?.map((item: CartItem) => item.productId) || [];
      const products = await db
        .collection('products')
        .find({ id: { $in: productIds } })
        .toArray();

      const cartProducts = (updatedCart.items || []).map((item: CartItem) => {
        const product = products.find((p: DBProduct) => p.id === item.productId);
        return product ? { ...product, quantity: item.quantity } : null;
      }).filter(Boolean);

      return NextResponse.json(cartProducts);
    }

    // Update quantity
    const updatedCart = await db.collection('carts').findOneAndUpdate(
      { userId: id, "items.productId": productId },
      { 
        $set: { 
          "items.$.quantity": quantity,
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );

    if (!updatedCart) {
      return NextResponse.json(
        { error: "Item not found in cart" }, 
        { status: 404 }
      );
    }

    const productIds = updatedCart.items.map((item: CartItem) => item.productId);
    const products = await db
      .collection('products')
      .find({ id: { $in: productIds } })
      .toArray();

    const cartProducts = updatedCart.items.map((item: CartItem) => {
      const product = products.find((p: DBProduct) => p.id === item.productId);
      return product ? { ...product, quantity: item.quantity } : null;
    }).filter(Boolean);

    return NextResponse.json(cartProducts);
  } catch (error) {
    console.error('PATCH /api/cart error:', error);
    return NextResponse.json(
      { error: "Failed to update quantity" }, 
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest, 
  { params }: { params: Promise<Params> }
) {
  try {
    const { db } = await connectToDB();
    const { id } = await params;
    const body: CartBody = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json(
        { error: "productId is required" }, 
        { status: 400 }
      );
    }

    const updatedCart = await db.collection('carts').findOneAndUpdate(
      { userId: id },
      { 
        $pull: { items: { productId } },
        $set: { updatedAt: new Date() }
      },
      { returnDocument: 'after' }
    );

    if (!updatedCart) {
      return NextResponse.json([], { status: 200 });
    }

    const productIds = updatedCart.items?.map((item: CartItem) => item.productId) || [];
    
    if (productIds.length === 0) {
      return NextResponse.json([]);
    }

    const products = await db
      .collection('products')
      .find({ id: { $in: productIds } })
      .toArray();

    const cartProducts = (updatedCart.items || []).map((item: CartItem) => {
      const product = products.find((p: DBProduct) => p.id === item.productId);
      return product ? { ...product, quantity: item.quantity } : null;
    }).filter(Boolean);

    return NextResponse.json(cartProducts);
  } catch (error) {
    console.error('DELETE /api/cart error:', error);
    return NextResponse.json(
      { error: "Failed to remove from cart" }, 
      { status: 500 }
    );
  }
}