import { v2 as cloudinary } from "cloudinary";

export function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Missing Cloudinary configuration");
  }

  return { cloudName, apiKey, apiSecret };
}

export function getCloudinaryUploadFolder() {
  return process.env.CLOUDINARY_UPLOAD_FOLDER || "styleshop/products";
}

export function signCloudinaryUpload(paramsToSign: Record<string, string>) {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  return {
    cloudName,
    apiKey,
    signature: cloudinary.utils.api_sign_request(paramsToSign, apiSecret),
  };
}

