import { config } from 'dotenv';
import { resolve } from 'path';
import { MongoClient, ServerApiVersion } from 'mongodb';
import { SEED_PRODUCTS } from '../app/lib/seed-products';

config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

function getConnectionUri(): string {
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }

  const user = process.env.MONGODB_USER;
  const password = process.env.MONGODB_PASSWORD;
  const host = process.env.MONGODB_CLUSTER_HOST;

  if (!user || !password || !host) {
    throw new Error(
      'Missing MongoDB configuration. Set MONGODB_URI, or MONGODB_USER, MONGODB_PASSWORD, and MONGODB_CLUSTER_HOST in .env.local.',
    );
  }

  return `mongodb+srv://${user}:${password}@${host}/?appName=Cluster0`;
}

async function seed() {
  const dbName = process.env.MONGODB_DB || 'ecommerce-nextjs';
  const client = new MongoClient(getConnectionUri(), {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('products');

    for (const product of SEED_PRODUCTS) {
      await collection.updateOne({ id: product.id }, { $set: product }, { upsert: true });
    }

    console.log(`Seeded ${SEED_PRODUCTS.length} products into "${dbName}.products".`);
  } finally {
    await client.close();
  }
}

seed().catch((error) => {
  console.error('Seed failed:', error.message);
  process.exit(1);
});
