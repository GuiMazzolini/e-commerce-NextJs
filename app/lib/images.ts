export function getImageSrc(imageUrl: string): string {
  const url = imageUrl?.trim();
  if (!url) return url;

  // If it's a Cloudinary URL, add lightweight delivery transforms
  // so the browser downloads a smaller, optimized version.
  if (url.startsWith("http") && url.includes("/image/upload/")) {
    // Example:
    // https://res.cloudinary.com/.../image/upload/v123/styleshop/products/hat.jpg
    // -> https://res.cloudinary.com/.../image/upload/v123/w_1200,q_auto,f_auto/styleshop/products/hat.jpg
    return url.replace(
      /\/image\/upload\/(v\d+)\//,
      `/image/upload/$1/w_1200,q_auto,f_auto/`
    );
  }

  return url.startsWith("http") ? url : `/${url.replace(/^\//, "")}`;
}

