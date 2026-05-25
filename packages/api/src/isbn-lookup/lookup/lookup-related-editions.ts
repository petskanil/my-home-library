import { lookupAllProviders } from "./lookup-all-providers";
import { PartialBookLookupResult } from "../shared/types";

export async function lookupRelatedEditions(
  originalIsbn: string,
  relatedIsbns: string[],
): Promise<PartialBookLookupResult[]> {
  const filtered = relatedIsbns.filter(
    (isbn) => isbn !== originalIsbn,
  );

  const settled = await Promise.allSettled(
    filtered.map((isbn) => lookupAllProviders(isbn)),
  );

  return settled.flatMap((result) => {
    if (result.status === "fulfilled") {
      return result.value.map((value) => ({
        ...value,
        exact_match: false,
      }));
    }

    return [];
  });
}