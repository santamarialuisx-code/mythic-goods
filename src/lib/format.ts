const LOCALE = "es-VE";

/** `1800` + `USD` → `$18` (drops trailing zeroes for round prices). */
export function formatPrice(cents: number, currency = "USD") {
  const isRound = cents % 100 === 0;

  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency,
    minimumFractionDigits: isRound ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/** "Negro / M" — skips the `Único` size used by one-size products. */
export function formatVariantLabel(
  size: string | null,
  color: string | null,
): string {
  const parts = [color, size].filter(
    (part): part is string => Boolean(part) && part !== "Único",
  );

  return parts.join(" / ") || "Único";
}
