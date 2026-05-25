import { PartialBookLookupResult } from "../shared/types";

import { lookupFromBibsys } from "../providers/bibsys";
import { lookupFromGoogleBooks } from "../providers/googlebooks";
import { lookupFromInternetArchive } from "../providers/internetarchive";
import { lookupFromNb } from "../providers/nb";
import { lookupFromOpenLibrary } from "../providers/openlibrary";

async function withTimeout<T>(
  promise: Promise<T>,
  ms = 5000,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), ms),
    ),
  ]);
}

export async function lookupAllProviders(
  isbn: string,
): Promise<PartialBookLookupResult[]> {
  const settled = await Promise.allSettled([
    withTimeout(lookupFromGoogleBooks(isbn)),
    withTimeout(lookupFromOpenLibrary(isbn)),
    withTimeout(lookupFromBibsys(isbn)),
    withTimeout(lookupFromInternetArchive(isbn)),
    withTimeout(lookupFromNb(isbn)),
  ]);

  return settled.flatMap((result) => {
    if (
      result.status === "fulfilled" &&
      result.value
    ) {
      return [result.value];
    }

    return [];
  });
}