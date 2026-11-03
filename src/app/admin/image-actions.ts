"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { hasAdminSession, writeBlockedReason } from "@/lib/admin-write-guard";
import {
  imageExtensionFor,
  isProductImagePath,
  productImagePath,
  validateImageSelection,
} from "@/lib/catalog/images";
import { PRODUCT_IMAGES_BUCKET } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Photo mutations for /admin.
 *
 * The bucket is public-read with no write policy, so uploads and deletes run
 * with the service_role key on the server and re-check the admin session
 * first: `proxy.ts` gates the page, not this endpoint.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Photo URLs are unique per upload, so they can be cached for a year. */
const CACHE_CONTROL = "31536000";

type AdminClient = ReturnType<typeof createAdminClient>;

export type ImageUploadState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; message: string };

function revalidateCatalog() {
  revalidatePath("/");
  revalidatePath("/catalog");
  revalidatePath("/admin");
  revalidatePath("/admin/products");
}

/** Best effort: an orphan object is recoverable, a row pointing nowhere is not. */
async function removeObjects(supabase: AdminClient, paths: string[]) {
  if (paths.length === 0) return;

  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .remove(paths);

  if (error) {
    console.error("[admin] orphan photo cleanup failed:", error.message, paths);
  }
}

export async function uploadProductImagesAction(
  _previousState: ImageUploadState,
  formData: FormData,
): Promise<ImageUploadState> {
  if (!(await hasAdminSession())) {
    return { status: "error", message: "Sesión vencida. Volvé a entrar." };
  }

  const blocked = writeBlockedReason();
  if (blocked) return { status: "error", message: blocked };

  const productId = String(formData.get("productId") ?? "");
  if (!UUID.test(productId)) {
    return { status: "error", message: "Producto inválido." };
  }

  // An empty file input still submits one nameless, sizeless entry.
  const files = formData
    .getAll("photos")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  const selection = validateImageSelection(files);
  if (!selection.ok) return { status: "error", message: selection.message };

  const supabase = createAdminClient();

  const { data: lastImage, error: positionError } = await supabase
    .from("product_images")
    .select("position")
    .eq("product_id", productId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (positionError) {
    return {
      status: "error",
      message: `No se pudieron leer las fotos: ${positionError.message}`,
    };
  }

  let position = (lastImage?.position ?? -1) + 1;
  const uploaded: string[] = [];

  for (const file of files) {
    const extension = imageExtensionFor(file.type);
    if (!extension) {
      await removeObjects(supabase, uploaded);
      return {
        status: "error",
        message: `${file.name}: formato no soportado.`,
      };
    }

    // The original name is dropped on purpose: accents, spaces and emoji make
    // brittle URLs, and a uuid cannot collide with an existing photo.
    const storagePath = productImagePath(
      productId,
      `${randomUUID()}.${extension}`,
    );

    const { error: uploadError } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(storagePath, await file.arrayBuffer(), {
        contentType: file.type,
        cacheControl: CACHE_CONTROL,
        upsert: false,
      });

    if (uploadError) {
      await removeObjects(supabase, uploaded);
      return {
        status: "error",
        message: `No se pudo subir ${file.name}: ${uploadError.message}`,
      };
    }

    const { error: rowError } = await supabase
      .from("product_images")
      .insert({ product_id: productId, storage_path: storagePath, position });

    if (rowError) {
      await removeObjects(supabase, [...uploaded, storagePath]);
      return {
        status: "error",
        message: `No se pudo guardar la foto: ${rowError.message}`,
      };
    }

    uploaded.push(storagePath);
    position += 1;
  }

  revalidateCatalog();

  return {
    status: "success",
    message:
      uploaded.length === 1
        ? "Foto agregada."
        : `${uploaded.length} fotos agregadas.`,
  };
}

/**
 * Row first, object second. If the object removal fails the row is already
 * gone, so no page points at a missing file; the leftover object is reported
 * and can be cleaned up by hand.
 */
export async function removeProductImageAction(formData: FormData) {
  if (!(await hasAdminSession())) redirect("/admin/login");

  if (writeBlockedReason()) return;

  const id = String(formData.get("id") ?? "");
  const productId = String(formData.get("productId") ?? "");

  if (!UUID.test(id) || !UUID.test(productId)) return;

  const supabase = createAdminClient();

  const { data: image, error: readError } = await supabase
    .from("product_images")
    .select("id, storage_path")
    .eq("id", id)
    .eq("product_id", productId)
    .maybeSingle();

  if (readError) {
    console.error("[admin] remove photo read failed:", readError.message);
    return;
  }

  if (!image) return;

  const { error: rowError } = await supabase
    .from("product_images")
    .delete()
    .eq("id", image.id)
    .eq("product_id", productId);

  if (rowError) {
    console.error("[admin] remove photo row failed:", rowError.message);
    return;
  }

  if (isProductImagePath(image.storage_path, productId)) {
    await removeObjects(supabase, [image.storage_path]);
  } else {
    console.error(
      "[admin] refuse to delete outside the product prefix:",
      image.storage_path,
    );
  }

  revalidateCatalog();
}
