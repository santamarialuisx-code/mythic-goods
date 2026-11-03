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

export type ImageSelectionResult<T extends ImageCandidate = ImageCandidate> =
  | { ok: true; accepted: { file: T; extension: string }[] }
  | { ok: false; message: string };

/** `"image/png"` → `"png"`; `null` when the type is not one we accept. */
export function imageExtensionFor(type: string): string | null {
  return EXTENSION_BY_TYPE[type] ?? null;
}

/**
 * Two decimals for a real size, none for a round limit: a file one byte over
 * 5 MB must not print "pesa 5,0 MB y el máximo es 5,0 MB.".
 */
function formatMegabytes(bytes: number, digits: number) {
  return `${(bytes / (1024 * 1024)).toFixed(digits).replace(".", ",")} MB`;
}

/** One file, one reason, plus the extension it will be stored under. */
type ImageCheck =
  | { ok: true; extension: string }
  | { ok: false; message: string };

/**
 * The single place a file is judged. The extension comes back with the verdict
 * so callers never have to look it up again, which is why no caller can hit a
 * "validated but unknown type" branch.
 *
 * The type is read from the browser-provided `type`, which is a claim, not a
 * proof; the bucket stays public-read and the file is only ever served as an
 * image, so a mislabelled file cannot become an executable response.
 */
function checkImageFile(file: ImageCandidate): ImageCheck {
  const extension = imageExtensionFor(file.type);

  if (!extension) {
    return {
      ok: false,
      message: `${file.name || "Archivo"}: formato no soportado. Usá JPG, PNG, WebP o AVIF.`,
    };
  }

  if (file.size === 0) {
    return { ok: false, message: `${file.name || "Archivo"}: el archivo está vacío.` };
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return {
      ok: false,
      message: `${file.name || "Archivo"}: pesa ${formatMegabytes(file.size, 2)} y el máximo es ${formatMegabytes(MAX_IMAGE_BYTES, 0)}.`,
    };
  }

  return { ok: true, extension };
}

/**
 * One file, one reason. Returns a Spanish message ready to render, or `null`
 * when the file is acceptable.
 */
export function validateImageFile(file: ImageCandidate): string | null {
  const check = checkImageFile(file);

  return check.ok ? null : check.message;
}

/**
 * A whole selection at once: count first (cheap and it explains the limit),
 * then the first file that fails. All-or-nothing, so a rejected selection
 * writes nothing.
 */
export function validateImageSelection<T extends ImageCandidate>(
  files: readonly T[],
): ImageSelectionResult<T> {
  if (files.length === 0) {
    return { ok: false, message: "Elegí al menos una foto." };
  }

  if (files.length > MAX_IMAGES_PER_UPLOAD) {
    return {
      ok: false,
      message: `Subí hasta ${MAX_IMAGES_PER_UPLOAD} fotos por vez.`,
    };
  }

  const accepted: { file: T; extension: string }[] = [];

  for (const file of files) {
    const check = checkImageFile(file);

    if (!check.ok) return { ok: false, message: check.message };

    accepted.push({ file, extension: check.extension });
  }

  return { ok: true, accepted };
}

/**
 * Storage layout: everything a product owns lives under `<productId>/`, so a
 * delete can be scoped by prefix and two products can never collide.
 */
export function productImagePath(productId: string, fileName: string) {
  return `${productId}/${fileName}`;
}

/**
 * The only shape `productImagePath` ever writes: `<uuid>/<uuid>.<ext>`.
 *
 * Each segment is hex digits and hyphens only, so `%`, `.` and `\` cannot
 * appear inside one: percent-encoded traversal (`%2e%2e%2f`), `..` and Windows
 * separators cannot match, and there is nothing to decode or normalize first.
 */
const PRODUCT_IMAGE_PATH =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpg|png|webp|avif)$/i;

/**
 * Guard for destructive calls: only paths inside that product are fair game.
 *
 * Strict on purpose. A prefix check alone would still accept
 * `<productId>/%2e%2e%2fother/x.png` or `<productId>/sub/x.png`; the full-shape
 * match keeps the bucket namespace flat and escapes impossible.
 */
export function isProductImagePath(storagePath: string, productId: string) {
  if (!productId) return false;

  return (
    storagePath.startsWith(`${productId}/`) &&
    PRODUCT_IMAGE_PATH.test(storagePath)
  );
}

/** Public URL for a file inside the `product-images` bucket. */
export function productImageUrl(storagePath: string) {
  return `${supabaseUrl}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${encodeURI(storagePath)}`;
}
