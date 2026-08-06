/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require("fs");
const path = require("path");

require("dotenv").config({ path: ".env.local" });

const { MongoClient, ServerApiVersion } = require("mongodb");
const { v2: cloudinary } = require("cloudinary");

function getConnectionUri() {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;

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

async function main() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const folder = process.env.CLOUDINARY_UPLOAD_FOLDER || "styleshop/products";

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Missing Cloudinary env vars");
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  const client = new MongoClient(getConnectionUri(), {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  const dbName = process.env.MONGODB_DB || "ecommerce-nextjs";
  const db = client.db(dbName);

  const publicDir = path.join(process.cwd(), "public");
  const seedFile = path.join(process.cwd(), "app/lib/seed-products.ts");

  const products = await db
    .collection("products")
    .find({})
    .project({ id: 1, imageUrl: 1 })
    .toArray();

  const filenameToSecureUrl = {};
  const filenamesToDelete = [];

  console.log(`Uploading ${products.length} product images to Cloudinary...`);

  for (const p of products) {
    if (!p?.id || typeof p.imageUrl !== "string") continue;
    const imageUrl = p.imageUrl.trim().replace(/^\/+/, "");

    if (imageUrl.startsWith("http")) {
      continue; // already migrated
    }

    const filename = imageUrl;
    const localPath = path.join(publicDir, filename);

    if (!fs.existsSync(localPath)) {
      throw new Error(`Missing local image for ${p.id}: ${filename}`);
    }

    const uploadRes = await cloudinary.uploader.upload(localPath, {
      folder,
      public_id: p.id, // stable id-based public_id
      overwrite: true,
      resource_type: "image",
    });

    const secureUrl = uploadRes.secure_url;
    filenameToSecureUrl[filename] = secureUrl;
    filenamesToDelete.push(filename);

    await db.collection("products").updateOne(
      { id: p.id },
      { $set: { imageUrl: secureUrl, updatedAt: new Date() } }
    );

    console.log(`- ${p.id}: ${filename} -> ${secureUrl}`);
  }

  // Update seed-products.ts so re-seeding doesn't break once public images are removed
  if (Object.keys(filenameToSecureUrl).length > 0) {
    let seedText = fs.readFileSync(seedFile, "utf8");
    for (const [filename, secureUrl] of Object.entries(
      filenameToSecureUrl
    )) {
      seedText = seedText.replace(
        new RegExp(`imageUrl:\\s*'${filename}'`, "g"),
        `imageUrl: '${secureUrl}'`
      );
    }
    fs.writeFileSync(seedFile, seedText);
    console.log("Updated app/lib/seed-products.ts with Cloudinary URLs.");
  }

  // Delete local images to enforce Cloudinary-only behavior
  for (const filename of filenamesToDelete) {
    const full = path.join(publicDir, filename);
    if (fs.existsSync(full)) fs.unlinkSync(full);
  }
  console.log(`Deleted ${filenamesToDelete.length} images from public/.`);

  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

