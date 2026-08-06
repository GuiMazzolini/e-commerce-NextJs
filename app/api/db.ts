import { Db, MongoClient, ServerApiVersion } from "mongodb";

let cachedClient: MongoClient | null = null;
let cachedDB: Db | null = null;
let indexesEnsured = false;

async function ensureIndexes(db: Db) {
  if (indexesEnsured) return;
  // Prevents duplicate orders when webhook + success page fulfill the same session.
  await db.collection("orders").createIndex(
    { stripeSessionId: 1 },
    { unique: true }
  );
  indexesEnsured = true;
}

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
    await ensureIndexes(cachedDB);
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

  await ensureIndexes(cachedDB);

  return { client: cachedClient, db: cachedDB };
}
