import {
  BookLookupResult,
  bookLookupResultSchema,
} from "@home-library/shared";

import { resolveCoverUrl } from "../covers/resolve-cover-url";
import { PartialBookLookupResult } from "../shared/types";

function orderBySources(
  results: PartialBookLookupResult[],
  sources: PartialBookLookupResult["source"][],
): PartialBookLookupResult[] {
  return sources.flatMap((source) =>
    results.filter((result) => result.source === source),
  );
}

function pickFirst<T>(
  results: PartialBookLookupResult[],
  selector: (
    result: PartialBookLookupResult,
  ) => T | undefined,
): T | undefined {
  return results
    .map(selector)
    .find((value) => {
      if (value === undefined || value === null) {
        return false;
      }

      if (
        typeof value === "string" &&
        !value.trim()
      ) {
        return false;
      }

      return true;
    });
}

function mergeSubjects(
  results: PartialBookLookupResult[],
): string[] | undefined {
  const subjects = Array.from(
    new Set(
      results
        .flatMap((result) => result.subjects ?? [])
        .map((subject) => subject.trim())
        .filter(Boolean),
    ),
  );

  return subjects.length
    ? subjects
    : undefined;
}

export async function mergeLookupResults(
  isbn: string,
  results: PartialBookLookupResult[],
): Promise<BookLookupResult | null> {
  const defaultPriority = orderBySources(results, [
    "bibsys",
    "nb",
    "googlebooks",
    "openlibrary",
    "internetarchive",
  ]);

  const title = pickFirst(
    defaultPriority,
    (result) => result.title,
  );

  const author = pickFirst(
    defaultPriority,
    (result) => result.author,
  );

  if (!title || !author) {
    return null;
  }

  const cover_url = await resolveCoverUrl(
    isbn,
    results,
  );

  const total_pages = pickFirst(
    defaultPriority,
    (result) => result.total_pages,
  );

  const publisher = pickFirst(
    defaultPriority,
    (result) => result.publisher,
  );

  const published_year = pickFirst(
    defaultPriority,
    (result) => result.published_year,
  );

  const language = pickFirst(
    defaultPriority,
    (result) => result.language,
  );

  const series = pickFirst(
    defaultPriority,
    (result) => result.series,
  );

  const subtitle = pickFirst(
    defaultPriority,
    (result) => result.subtitle,
  );

  const description = pickFirst(
    defaultPriority,
    (result) => result.description,
  )?.slice(0, 5000);

  const subjects = mergeSubjects(
    defaultPriority,
  );

  const sources = Array.from(
    new Set(
      results.map((result) => result.source),
    ),
  );

  const source =
    sources.length > 1
      ? "merged"
      : sources[0];

  const parsed =
    bookLookupResultSchema.safeParse({
      title,
      author,
      isbn,
      cover_url,
      total_pages,
      publisher,
      published_year,
      language,
      series,
      subtitle,
      description,
      subjects,
      source,
      sources,
    });

  if (!parsed.success) {
    console.error(
      "Failed to merge lookup results",
      parsed.error,
    );

    return null;
  }

  return parsed.data;
}