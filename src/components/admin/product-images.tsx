"use client";

import Image from "next/image";
import { useActionState, useState } from "react";

import {
  removeProductImageAction,
  uploadProductImagesAction,
  type ImageUploadState,
} from "@/app/admin/image-actions";
import { Button } from "@/components/ui/button";
import type { AdminProductImage } from "@/lib/admin-queries";
import {
  IMAGE_ACCEPT,
  MAX_IMAGES_PER_UPLOAD,
  MAX_IMAGE_BYTES,
  productImageUrl,
  validateImageSelection,
} from "@/lib/catalog/images";

const initialState: ImageUploadState = { status: "idle" };

const maxMegabytes = MAX_IMAGE_BYTES / (1024 * 1024);

/**
 * Photos of one product: thumbnails with a remove button, plus an upload field.
 *
 * The file input is validated in the browser first so an oversized selection
 * fails with a readable message instead of the framework's body-limit error;
 * the action validates again because the request is the real boundary.
 */
export function ProductImages({
  productId,
  images,
}: {
  productId: string;
  images: AdminProductImage[];
}) {
  const [state, formAction, pending] = useActionState(
    uploadProductImagesAction,
    initialState,
  );
  const [localError, setLocalError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const input = event.currentTarget.elements.namedItem("photos");

    if (!(input instanceof HTMLInputElement)) return;

    const selection = validateImageSelection(Array.from(input.files ?? []));

    if (!selection.ok) {
      event.preventDefault();
      setLocalError(selection.message);
      return;
    }

    setLocalError(null);
  }

  return (
    <section className="space-y-4">
      <div>
        <p className="eyebrow">Fotos</p>
        <p className="mt-1 text-xs text-mist/70">
          La primera es la que se ve en el catálogo y en la ficha. JPG, PNG,
          WebP o AVIF, hasta {maxMegabytes} MB cada una y{" "}
          {MAX_IMAGES_PER_UPLOAD} por vez.
        </p>
      </div>

      {images.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image, index) => (
            <li
              key={image.id}
              className="overflow-hidden rounded-xl border border-ink-line bg-ink-soft"
            >
              <div className="relative aspect-square">
                <Image
                  src={productImageUrl(image.path)}
                  alt={image.alt ?? `Foto ${index + 1}`}
                  fill
                  sizes="(min-width: 640px) 180px, 45vw"
                  className="object-cover"
                />
              </div>
              <div className="flex items-center justify-between gap-2 px-2.5 py-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-mist">
                  {index === 0 ? "Principal" : `Foto ${index + 1}`}
                </span>
                <form action={removeProductImageAction}>
                  <input type="hidden" name="id" value={image.id} />
                  <input type="hidden" name="productId" value={productId} />
                  <button
                    type="submit"
                    className="text-xs text-mist transition-colors hover:text-red-300"
                    aria-label={`Quitar la foto ${index + 1}`}
                  >
                    Quitar
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-ink-line px-4 py-6 text-center text-xs text-mist">
          Sin fotos todavía: la tienda muestra el unicornio.
        </p>
      )}

      <form action={formAction} onSubmit={handleSubmit} className="space-y-3">
        <input type="hidden" name="productId" value={productId} />
        <input
          type="file"
          name="photos"
          accept={IMAGE_ACCEPT}
          multiple
          className="block w-full cursor-pointer rounded-xl border border-ink-line bg-ink-soft px-3.5 py-3 text-sm text-mist file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-bone/90 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-ink"
        />
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          {pending ? "Subiendo…" : "Subir fotos"}
        </Button>

        {localError ? (
          <p role="alert" className="text-xs text-red-300">
            {localError}
          </p>
        ) : null}

        {state.status === "error" ? (
          <p role="alert" className="text-xs text-red-300">
            {state.message}
          </p>
        ) : null}

        {state.status === "success" ? (
          <p className="text-xs text-emerald-300">{state.message}</p>
        ) : null}
      </form>
    </section>
  );
}
