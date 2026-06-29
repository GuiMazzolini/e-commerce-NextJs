import { MongoClient, ServerApiVersion } from "mongodb";

let cachedClient: MongoClient | null = null;
// Typed as `any` so existing dynamic collection access keeps working.
let cachedDB: any = null;

function getConnectionUri(): string {
  // Prefer a full connection string when provided.
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }

  const user = process.env.MONGODB_USER;
  const password = process.env.MONGODB_PASSWORD;
  const host = process.env.MONGODB_CLUSTER_HOST;

  if (!user || !password || !host) {
    throw new Error(
      "Missing MongoDB configuration. Set MONGODB_URI, or MONGODB_USER, MONGODB_PASSWORD, and MONGODB_CLUSTER_HOST."
    );
  }

  return `mongodb+srv://${user}:${password}@${host}/?appName=Cluster0`;
}

export async function connectToDB() {
  if (cachedClient && cachedDB) {
    return { client: cachedClient, db: cachedDB };
  }

  const dbName = process.env.MONGODB_DB || "ecommerce-nextjs";
  const client = new MongoClient(getConnectionUri(), {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  await client.connect();

  cachedClient = client;
  cachedDB = client.db(dbName);

  return { client: cachedClient, db: cachedDB };
}
