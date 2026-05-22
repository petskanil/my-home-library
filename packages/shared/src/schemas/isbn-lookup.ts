import { z } from "zod";

export const bookLookupResultSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  isbn: z.string().min(10),
  cover_url: z.string().url().optional(),
  source: z.enum(["nb", "bibsys", "openlibrary"]),
});

export type BookLookupResult = z.infer<typeof bookLookupResultSchema>;

/** Strip hyphens/spaces; keep digits and X. */
export function normalizeIsbn(raw: string): string | null {
  const cleaned = raw.replace(/[\s-]/g, "").toUpperCase();
  if (/^\d{13}$/.test(cleaned)) return cleaned;
  if (/^\d{9}[\dX]$/.test(cleaned)) return cleaned;
  return null;
}

/** Convert ISBN-10 to ISBN-13 (for APIs that require EAN form). */
export function isbn10ToIsbn13(isbn10: string): string | null {
  const normalized = normalizeIsbn(isbn10);
  if (!normalized || normalized.length !== 10) return null;
  const body = `978${normalized.slice(0, 9)}`;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += Number(body[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const check = (10 - (sum % 10)) % 10;
  return `${body}${check}`;
}

/**
 * Extract ISBN from a scanned barcode (EAN-13, ISBN-10, Code128, etc.).
 */
export function parseIsbnFromBarcode(data: string): string | null {
  const direct = normalizeIsbn(data);
  if (direct) {
    return direct.length === 10 ? (isbn10ToIsbn13(direct) ?? direct) : direct;
  }

  const digits = data.replace(/[^\dX]/gi, "").toUpperCase();
  if (/^97[89]\d{10}$/.test(digits)) return digits;
  if (/^\d{13}$/.test(digits) && (digits.startsWith("978") || digits.startsWith("979"))) {
    return digits;
  }
  if (/^\d{9}[\dX]$/.test(digits)) {
    return isbn10ToIsbn13(digits) ?? digits;
  }

  return null;
}
