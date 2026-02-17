import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "../../db";

type Params = { id: string };

export async function GET(request: NextRequest, { params }: { params: Promise<Params> }) {
    const { db } = await connectToDB();
    const { id } = await params;

    const product = await db.collection('products').findOne({ id: id })

    if (!product) {
        return NextResponse.json(
            { error: 'Product not found!' }, 
            { status: 404 }
        );
    };

    return NextResponse.json(product);
};