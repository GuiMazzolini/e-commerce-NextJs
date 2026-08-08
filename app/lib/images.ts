const CLOUDINARY_TRANSFORM = "w_1200,q_auto,f_auto";

/**
 * Normalize product image URLs and, for Cloudinary delivery URLs,
 * inject lightweight transforms so the browser downloads a smaller asset.
 *
 * Correct Cloudinary shape:
 *   .../image/upload/<transforms>/<version>/<public_id>
 */
export function getImageSrc(imageUrl: string): string {
  const url = imageUrl?.trim();
  if (!url) return url;

  if (url.startsWith("http") && url.includes("/image/upload/")) {
    // Already transformed (by us or manually) — leave alone.
    if (url.includes(CLOUDINARY_TRANSFORM)) {
      return url;
    }

    // Insert transforms immediately after /image/upload/
    return url.replace(
      /\/image\/upload\//,
      `/image/upload/${CLOUDINARY_TRANSFORM}/`
    );
  }

  return url.startsWith("http") ? url : `/${url.replace(/^\//, "")}`;
}
