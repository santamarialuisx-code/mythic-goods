import Image from "next/image";

import { UnicornMark } from "@/components/brand/unicorn-mark";
import { productImageUrl } from "@/lib/catalog/images";
import { cn } from "@/lib/utils";

/**
 * Renders a product photo, or a generated placeholder when the product has no
 * image in Storage yet. Always fills its container, so give it an aspect ratio.
 */
export function ProductMedia({
  path,
  alt,
  className,
  sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw",
  priority = false,
}: {
  path: string | null;
  alt: string | null;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-ink-soft", className)}>
      {path ? (
        <Image
          src={productImageUrl(path)}
          alt={alt ?? ""}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_30%_20%,rgba(139,123,247,0.22),transparent_60%),radial-gradient(circle_at_80%_85%,rgba(227,200,141,0.16),transparent_55%)]"
        >
          <UnicornMark className="h-12 w-12 text-mist/40" />
        </div>
      )}
    </div>
  );
}
