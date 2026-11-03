/**
 * Money input helpers.
 *
 * The database keeps integer cents; the owner types decimal dollars. That
 * conversion lives here so it happens once.
 *
 * Never do `Number.parseFloat(raw) * 100`: `18.50 * 100` is 1849.9999999999998,
 * which rounds to a price one cent short. Split the string instead.
 */

export type ParsedMoney =
  | { ok: true; cents: number }
  | { ok: false; reason: "empty" | "invalid" };

/** Digits, an optional `.` or `,`, and at most two decimals. No signs, no separators of thousands. */
const MONEY_INPUT = /^(\d{1,9})(?:[.,](\d{1,2}))?$/;

/** `"18,50"` → `{ ok: true, cents: 1850 }`. */
export function parseMoneyInput(raw: string): ParsedMoney {
  const value = raw.trim();

  if (value.length === 0) return { ok: false, reason: "empty" };

  const match = MONEY_INPUT.exec(value);
  if (!match) return { ok: false, reason: "invalid" };

  const whole = Number(match[1]);
  const fraction = Number((match[2] ?? "").padEnd(2, "0"));
  const cents = whole * 100 + fraction;

  return Number.isSafeInteger(cents)
    ? { ok: true, cents }
    : { ok: false, reason: "invalid" };
}

/** `1850` → `"18.50"`. `null` renders as an empty field. */
export function formatMoneyInput(cents: number | null | undefined): string {
  if (cents == null) return "";

  const whole = Math.trunc(cents / 100);
  const fraction = Math.abs(cents % 100).toString().padStart(2, "0");

  return `${whole}.${fraction}`;
}
