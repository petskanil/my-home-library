import { imageExists } from "../shared/image-exists";
import { PartialBookLookupResult } from "../shared/types";
import { coverCache } from "./covers-cache";
import { fetchOpenLibraryCover } from "./openlibrary-cover";

export async function resolveCoverUrl(
  isbn: string,
  results: PartialBookLookupResult[],
): Promise<string | undefined> {
  if (coverCache.has(isbn)) {
    return coverCache.get(isbn) ?? undefined;
  }

  const coverPriority = [
    ...results.filter((r) => r.source === "googlebooks"),
    ...results.filter((r) => r.source === "nb"),
    ...results.filter((r) => r.source === "openlibrary"),
    ...results.filter((r) => r.source === "internetarchive"),
  ];

  const existingCover = coverPriority.find(
    (result) => result.cover_url,
  )?.cover_url;

  if (existingCover) {
    const isInvalidArchiveCover =
      existingCover.includes("archive.org") &&
      !(await imageExists(existingCover));

    if (!isInvalidArchiveCover) {
      coverCache.set(isbn, existingCover);
      return existingCover;
    }
  }

  const resolved =
    (await fetchOpenLibraryCover(isbn)) ??
    undefined;

  coverCache.set(isbn, resolved ?? null);

  return resolved;
}