// Older database records referenced JPGs that were never shipped with the project.
// Keep those existing records rendering while new products use their own image URLs.
const legacyImages: Record<string, string> = {
  "/products/placeholder.jpg": "/products/placeholder.svg",
  "/products/marble-swirl.jpg": "/products/marble-swirl.svg",
  "/products/neon-cyberpunk.jpg": "/products/neon-cyberpunk.svg",
  "/products/minimal-wave.jpg": "/products/minimal-wave.svg",
  "/products/floral-bloom.jpg": "/products/floral-bloom.svg",
};

export const PRODUCT_IMAGE_FALLBACK = "/products/placeholder.svg";

/** Resolve a product image URL, mapping legacy paths and falling back to a placeholder. */
export function resolveProductImage(imageUrl: string | null | undefined, failed = false): string {
  if (failed || !imageUrl) return PRODUCT_IMAGE_FALLBACK;
  const mapped = legacyImages[imageUrl] || imageUrl;
  // next/image only accepts a root-relative path or an absolute http(s)/data URL.
  // Any other value (a bare filename, a relative path) resolves against the
  // current route and 404s — returning the HTML error page, which breaks the
  // <Image>. Fall back to the shipped placeholder so a stray record can never
  // break the layout.
  if (!/^(\/|https?:\/\/|data:)/.test(mapped)) return PRODUCT_IMAGE_FALLBACK;
  return mapped;
}
