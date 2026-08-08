import { Db, MongoClient, ServerApiVersion } from "mongodb";

let cachedClient: MongoClient | null = null;
let cachedDB: Db | null = null;
let indexesEnsured = false;

async function ensureIndexes(db: Db) {
  if (indexesEnsured) return;

  await Promise.all([
    // Prevents duplicate orders when webhook + success page fulfill the same session.
    db.collection("orders").createIndex({ stripeSessionId: 1 }, { unique: true }),
    db.collection("orders").createIndex({ userId: 1, createdAt: -1 }),

    // Registration does check-then-insert, which races. This is what actually
    // enforces one account per email.
    db.collection("users").createIndex({ email: 1 }, { unique: true }),

    db.collection("carts").createIndex({ userId: 1 }, { unique: true }),

    // Every product lookup queries by `id`, not `_id`.
    db.collection("products").createIndex({ id: 1 }, { unique: true }),

    // Rate-limit windows expire themselves.
    db
      .collection("ratelimits")
      .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ]);

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
    // The driver defaults to 30s, which makes an unreachable database look
    // like a hung page rather than a failure. Fail fast and surface the error.
    serverSelectionTimeoutMS: 5000,
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
