import {
  normalizeIsbn,
  type BookLookupResult,
} from "@home-library/shared";

import { mergeLookupResults } from "./merge/merge-lookup-results";
import { discoverRelatedIsbns } from "./lookup/discover-related-isbns";
import { lookupAllProviders } from "./lookup/lookup-all-providers";
import { lookupRelatedEditions } from "./lookup/lookup-related-editions";
import { expandFuzzyEditions } from "./lookup/expand-fuzzy-editions";
import { searchOpenLibraryBroad } from "./providers/openlibrary-broad-search";
import { discoverNearbyQueries } from "./lookup/discover-nearby-isbns";
import { isbnSimilarity } from "./shared/isbn-similarity";

export async function lookupBookByIsbn(
  rawIsbn: string,
): Promise<BookLookupResult | null> {
  const isbn = normalizeIsbn(rawIsbn);

  if (!isbn) {
    return null;
  }

const primaryResults =
  await lookupAllProviders(
    isbn,
  );

if (!primaryResults.length) {
  const nearbyQueries =
  discoverNearbyQueries(
    isbn,
  );

const broadResults =
  (
    await Promise.all(
      nearbyQueries.map(
        searchOpenLibraryBroad,
      ),
    )
  )
    .flat()
    .filter((result) => {
      const related =
        result.related_isbns ??
        [];

      return related.some(
        (candidate) =>
          isbnSimilarity(
            isbn,
            candidate,
          ) >= 0.7,
      );
    });

primaryResults.push(
  ...broadResults,
);
}


const relatedIsbns =
  discoverRelatedIsbns(
    primaryResults,
  );


const relatedResults =
  await lookupRelatedEditions(
    isbn,
    relatedIsbns,
  );


const fuzzyResults =
  await expandFuzzyEditions([
    ...primaryResults,
    ...relatedResults,
  ]);

const merged =
  await mergeLookupResults(
    isbn,
    [
      ...primaryResults,
      ...relatedResults,
      ...fuzzyResults,
    ],
  );

  return merged;
}