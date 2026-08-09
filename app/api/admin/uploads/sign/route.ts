import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { isAdminEmail } from "@/app/lib/admin";
import { enforceRateLimit, RATE_LIMITS } from "@/app/lib/rate-limit";
import {
  getCloudinaryUploadFolder,
  signCloudinaryUpload,
} from "@/app/lib/cloudinary";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = await enforceRateLimit(
    req,
    "upload-sign",
    RATE_LIMITS.uploadSign.limit,
    RATE_LIMITS.uploadSign.windowSec
  );
  if (limited) return limited;

  try {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const folder = getCloudinaryUploadFolder();
    const paramsToSign = { folder, timestamp };
    const { cloudName, apiKey, signature } = signCloudinaryUpload(paramsToSign);

    return NextResponse.json({
      cloudName,
      apiKey,
      timestamp,
      folder,
      signature,
    });
  } catch {
    return NextResponse.json(
      { error: "Cloudinary is not configured" },
      { status: 500 }
    );
  }
}

