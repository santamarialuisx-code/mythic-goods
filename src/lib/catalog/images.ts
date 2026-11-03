import { PRODUCT_IMAGES_BUCKET, supabaseUrl } from "@/lib/env";

/** Public URL for a file inside the `product-images` bucket. */
export function productImageUrl(storagePath: string) {
  return `${supabaseUrl}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${encodeURI(storagePath)}`;
}
