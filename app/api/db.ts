
import { MongoClient, ServerApiVersion } from "mongodb";

let cachedClient: MongoClient | null = null;
let cachedDB: any | null = null;

export async function connectToDB() {
    if (cachedClient && cachedDB) {
        return { client: cachedClient, db: cachedDB }
    };

    const uri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@cluster0.pcdqib7.mongodb.net/?appName=Cluster0`;
    
    const client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    });
    


    await client.connect();

    cachedClient = client;
    cachedDB = client.db('ecommerce-nextjs');

    return { client, db: client.db('ecommerce-nextjs') }
      
}

