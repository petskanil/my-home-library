import {
  normalizeIsbn,
  type BookLookupResult,
} from "@home-library/shared";
import {  PartialBookLookupResult } from "./shared/types";
import { lookupFromOpenLibrary } from "./providers/openlibrary";
import { lookupFromGoogleBooks } from "./providers/googlebooks";
import { lookupFromBibsys } from "./providers/bibsys";
import { lookupFromInternetArchive } from "./providers/internetarchive";
import { lookupFromNb } from "./providers/nb";
import { mergeLookupResults } from "./merge/merge-lookup-results";

/**
 * Look up book metadata by ISBN. Combines data from all available sources,
 * using each source to fill gaps for the richest possible result.
 */
export async function lookupBookByIsbn(
  rawIsbn: string,
): Promise<BookLookupResult | null> {
  const isbn = normalizeIsbn(rawIsbn);
  if (!isbn) return null;

  const [googlebooks, openlibrary, bibsys, internetarchive, nb] = await Promise.all([
    lookupFromGoogleBooks(isbn).catch(() => null),
    lookupFromOpenLibrary(isbn).catch(() => null),
    lookupFromBibsys(isbn).catch(() => null),
    lookupFromInternetArchive(isbn).catch(() => null),
    lookupFromNb(isbn).catch(() => null),
  ]);

  const results = [googlebooks, openlibrary, bibsys, internetarchive, nb].filter(
    (result): result is PartialBookLookupResult => Boolean(result),
  );

  if (!results.length) return null;
  return mergeLookupResults(isbn, results);
}
