import { dedupeIsbns } from "../shared/isbn";
import { PartialBookLookupResult } from "../shared/types";

export function discoverRelatedIsbns(
  results: PartialBookLookupResult[],
): string[] {
  return dedupeIsbns(
    results.flatMap(
      (result) => result.related_isbns ?? [],
    ),
  );
}