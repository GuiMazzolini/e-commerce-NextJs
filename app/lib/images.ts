export function getImageSrc(imageUrl: string): string {
  return imageUrl.startsWith("http") ? imageUrl : `/${imageUrl.replace(/^\//, "")}`;
}

