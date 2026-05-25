
import { searchOpenLibraryByTitle } from "../providers/openlibrary-search";
import { booksAreSimilar } from "../shared/book-similarity";

import { PartialBookLookupResult } from "../shared/types";

export async function expandFuzzyEditions(
  results: PartialBookLookupResult[],
): Promise<
  PartialBookLookupResult[]
> {
  const expanded: PartialBookLookupResult[] =
    [];

  for (const result of results) {
    if (!result.title) {
      continue;
    }

    const candidates =
      await searchOpenLibraryByTitle(
        result.title,
      );

    for (const candidate of candidates) {
      if (
        booksAreSimilar(
          result,
          candidate,
        )
      ) {
        expanded.push({
          ...candidate,

          confidence: 0.6,
        });
      }
    }
  }

  return expanded;
}