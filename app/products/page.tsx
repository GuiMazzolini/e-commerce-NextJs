import { connectToDB } from "@/app/api/db";
import ProductsList from '../components/ProductsList';
import { WithId, Document } from "mongodb";

export default async function ProductsPage() {
  const { db } = await connectToDB();
  const products = await db.collection('products').find({}).toArray();


  const serialized = products.map(({ _id, ...rest }: WithId<Document>) => rest);


  return <ProductsList products={serialized} />;
}