import { BookLookupResult, bookLookupResultSchema } from "@home-library/shared";
import { PartialBookLookupResult } from "../shared/types";
import { resolveCoverUrl } from "../covers/resolve-cover-url";

export async function mergeLookupResults(
  isbn: string,
  results: PartialBookLookupResult[],
): Promise<BookLookupResult | null> {
    const orderedResults = [
  ...results.filter((r) => r.source === "bibsys"),
  ...results.filter((r) => r.source === "nb"),
  ...results.filter((r) => r.source === "googlebooks"),
  ...results.filter((r) => r.source === "internetarchive"),
  ...results.filter((r) => r.source === "openlibrary"),
];

  const title = pickFirst(
    orderedResults,
    (r) => r.title,
    );
  const author = pickFirst(
    orderedResults,
    (r) => r.author,
    );
  const cover_url = await resolveCoverUrl(isbn, results);
  const total_pages = pickFirst(
    orderedResults,
    (r) => r.total_pages,
  );
  const publisher = pickFirst(
    orderedResults,
    (r) => r.publisher,
  );
  const published_year = pickFirst(
    orderedResults,
    (r) => r.published_year,
  );
  const language = pickFirst(
    orderedResults,
    (r) => r.language,
  );
  const series = pickFirst(
    orderedResults,
    (r) => r.series,
  );
  const subtitle = pickFirst(
    orderedResults,
    (r) => r.subtitle,
  );
  const description = pickFirst(
    orderedResults,
    (r) => r.description,
  );
  const subjects = Array.from(
    new Set(
      results.flatMap((result) => result.subjects ?? []),
    ),
  );

  if (!title || !author) return null;

  const sources = Array.from(new Set(results.map((result) => result.source)));
  const source = sources.length > 1 ? "merged" : sources[0];

  return bookLookupResultSchema.parse({
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
    subjects: subjects.length ? subjects : undefined,
    source,
    sources,
  });
}

function pickFirst<T>(
  results: PartialBookLookupResult[],
  selector: (
    result: PartialBookLookupResult,
  ) => T | undefined,
): T | undefined {
  return results
    .map(selector)
    .find((value) => value !== undefined);
}