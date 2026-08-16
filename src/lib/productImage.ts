// Older database records referenced JPGs that were never shipped with the project.
// Keep those existing records rendering while new products use their own image URLs.
const legacyImages: Record<string, string> = {
  "/products/marble-swirl.jpg": "/products/marble-swirl.svg",
  "/products/neon-cyberpunk.jpg": "/products/neon-cyberpunk.svg",
  "/products/minimal-wave.jpg": "/products/minimal-wave.svg",
  "/products/floral-bloom.jpg": "/products/floral-bloom.svg",
};

export const PRODUCT_IMAGE_FALLBACK = "/products/placeholder.svg";

/** Resolve a product image URL, mapping legacy paths and falling back to a placeholder. */
export function resolveProductImage(imageUrl: string | null | undefined, failed = false): string {
  if (failed) return PRODUCT_IMAGE_FALLBACK;
  if (!imageUrl) return PRODUCT_IMAGE_FALLBACK;
  return legacyImages[imageUrl] || imageUrl;
}
