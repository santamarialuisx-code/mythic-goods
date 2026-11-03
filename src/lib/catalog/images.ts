import { PRODUCT_IMAGES_BUCKET, supabaseUrl } from "@/lib/env";

/**
 * Product photo rules, shared by the upload action and the form.
 *
 * This module must stay free of `server-only`: the client form imports the
 * limits to render `accept` and the inline copy of the messages.
 */

/** Per file. Generous enough for a phone photo, small enough to parse safely. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Per upload. `bodySizeLimit` in next.config.ts is sized from these two. */
export const MAX_IMAGES_PER_UPLOAD = 6;

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

/** For `<input type="file" accept>`. */
export const IMAGE_ACCEPT = ALLOWED_IMAGE_TYPES.join(",");

/** What validation needs; `File` and the raw `FormData` entries both fit. */
export type ImageCandidate = { name: string; type: string; size: number };

export type ImageSelectionResult =
  | { ok: true }
  | { ok: false; message: string };

/** `"image/png"` → `"png"`; `null` when the type is not one we accept. */
export function imageExtensionFor(type: string): string | null {
  return EXTENSION_BY_TYPE[type] ?? null;
}

function formatMegabytes(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

/**
 * One file, one reason. Returns a Spanish message ready to render, or `null`
 * when the file is acceptable.
 *
 * The type is read from the browser-provided `type`, which is a claim, not a
 * proof; the bucket stays public-read and the file is only ever served as an
 * image, so a mislabelled file cannot become an executable response.
 */
export function validateImageFile(file: ImageCandidate): string | null {
  if (!imageExtensionFor(file.type)) {
    return `${file.name || "Archivo"}: formato no soportado. Usá JPG, PNG, WebP o AVIF.`;
  }

  if (file.size === 0) {
    return `${file.name || "Archivo"}: el archivo está vacío.`;
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return `${file.name || "Archivo"}: pesa ${formatMegabytes(file.size)} y el máximo es ${formatMegabytes(MAX_IMAGE_BYTES)}.`;
  }

  return null;
}

/**
 * A whole selection at once: count first (cheap and it explains the limit),
 * then the first file that fails. All-or-nothing, so a rejected selection
 * writes nothing.
 */
export function validateImageSelection(
  files: readonly ImageCandidate[],
): ImageSelectionResult {
  if (files.length === 0) {
    return { ok: false, message: "Elegí al menos una foto." };
  }

  if (files.length > MAX_IMAGES_PER_UPLOAD) {
    return {
      ok: false,
      message: `Subí hasta ${MAX_IMAGES_PER_UPLOAD} fotos por vez.`,
    };
  }

  for (const file of files) {
    const error = validateImageFile(file);

    if (error) return { ok: false, message: error };
  }

  return { ok: true };
}

/**
 * Storage layout: everything a product owns lives under `<productId>/`, so a
 * delete can be scoped by prefix and two products can never collide.
 */
export function productImagePath(productId: string, fileName: string) {
  return `${productId}/${fileName}`;
}

/** Guard for destructive calls: only paths inside that product are fair game. */
export function isProductImagePath(storagePath: string, productId: string) {
  if (!productId || storagePath.includes("..")) return false;

  return storagePath.startsWith(`${productId}/`) && storagePath.length > productId.length + 1;
}

/** Public URL for a file inside the `product-images` bucket. */
export function productImageUrl(storagePath: string) {
  return `${supabaseUrl}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${encodeURI(storagePath)}`;
}
