import { z } from "zod";

export const BOOK_LOOKUP_SOURCES = [
  "nb",
  "bibsys",
  "openlibrary",
  "googlebooks",
  "internetarchive",
] as const;

export type BookLookupSource =
  (typeof BOOK_LOOKUP_SOURCES)[number];

export const bookLookupSourceSchema = z.enum(
  BOOK_LOOKUP_SOURCES,
);

export type PartialBookLookupResult = {
  source: BookLookupSource;

  /**
   * ISBN that produced this result.
   */
  isbn: string;

  /**
   * Other ISBNs representing the same work/edition family.
   */
  related_isbns?: string[];

  /**
   * Whether this provider matched the exact requested ISBN.
   */
  exact_match?: boolean;

  /**
   * Optional provider confidence.
   */
  confidence?: number;

  /**
   * Optional provider-specific identifier.
   */
  provider_id?: string;

  title?: string;
  subtitle?: string;
  author?: string;

  cover_url?: string;

  total_pages?: number;
  publisher?: string;
  published_year?: number;

  language?: string;
  series?: string;
  description?: string;

  subjects?: string[];
};

export type NbItem = {
  metadata?: {
    title?: string;
    creators?: string[];
    identifiers?: {
      isbn10?: string[];
      isbn13?: string[];
    };
  };
  _links?: {
    thumbnail_medium?: { href?: string };
    thumbnail_large?: { href?: string };
  };
};