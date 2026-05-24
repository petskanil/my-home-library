import { BookLookupResult } from "@home-library/shared";

export type BookLookupSource =
  | "nb"
  | "bibsys"
  | "openlibrary"
  | "googlebooks"
  | "internetarchive";


export type PartialBookLookupResult = Partial<
  Omit<BookLookupResult, "source" | "sources">
> & { source: BookLookupSource };

export type NbItem = {
  metadata?: {
    title?: string;
    creators?: string[];
    identifiers?: { isbn13?: string[] };
  };
  _links?: {
    thumbnail_medium?: { href?: string };
    thumbnail_large?: { href?: string };
  };
};