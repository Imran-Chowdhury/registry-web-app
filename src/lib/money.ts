/**
 * Money is USD, stored and passed around as an integer number of cents ("minor units").
 * Floats corrupt currency arithmetic and Prisma's Decimal does not serialise cleanly
 * across the server/client boundary, so cents-as-Int is the only representation used.
 *
 * Conversion to a human-readable string happens here and nowhere else.
 */

const CURRENCY = 'USD';
const LOCALE = 'en-US';
const MINOR_UNITS_PER_MAJOR = 100;

/** `100.5` (dollars) -> `10050` (cents). Rounds to the nearest cent. */
export function toMinor(major: number): number {
  return Math.round(major * MINOR_UNITS_PER_MAJOR);
}

/** `10050` (cents) -> `100.5` (dollars). For form inputs, not for arithmetic. */
export function fromMinor(minor: number): number {
  return minor / MINOR_UNITS_PER_MAJOR;
}

/** `10050` -> `"$100.50"`. The only place a currency symbol is produced. */
export function formatMoney(minor: number): string {
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: CURRENCY,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(fromMinor(minor));
}

/** `10050` -> `"100.50"`. Amount without the symbol, for tight table columns. */
export function formatMoneyPlain(minor: number): string {
  return fromMinor(minor).toFixed(2);
}
