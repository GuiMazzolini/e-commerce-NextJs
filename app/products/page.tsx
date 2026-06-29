import type { Metadata } from "next";
import { connectToDB } from "@/app/api/db";
import ProductsList from '../components/ProductsList';
import { WithId, Document } from "mongodb";

export const metadata: Metadata = {
  title: "Products",
  description: "Browse the full StyleShop catalog and add your favorites to the cart.",
};

export default async function ProductsPage() {
  const { db } = await connectToDB();
  const products = await db.collection('products').find({}).toArray();


  const serialized = products.map(({ _id, ...rest }: WithId<Document>) => rest);


  return <ProductsList products={serialized} />;
}