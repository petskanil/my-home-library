import {
  BookLookupResult,
  bookLookupResultSchema,
} from "@home-library/shared";

import { resolveCoverUrl } from "../covers/resolve-cover-url";

import {
  PartialBookLookupResult,
} from "../shared/types";

const FIELD_PRIORITIES = {
  title: [
    "nb",
    "bibsys",
    "googlebooks",
    "openlibrary",
    "internetarchive",
  ],

  author: [
    "nb",
    "bibsys",
    "googlebooks",
    "openlibrary",
    "internetarchive",
  ],

  description: [
    "googlebooks",
    "openlibrary",
    "internetarchive",
    "nb",
    "bibsys",
  ],

  cover_url: [
    "googlebooks",
    "openlibrary",
    "nb",
    "internetarchive",
    "bibsys",
  ],
} as const;

function sortByConfidence(
  results: PartialBookLookupResult[],
): PartialBookLookupResult[] {
  return [...results].sort((a, b) => {
    const confidenceDiff =
      (b.confidence ?? 0) -
      (a.confidence ?? 0);

    if (confidenceDiff !== 0) {
      return confidenceDiff;
    }

    // Exact matches win ties
    if (
      a.exact_match &&
      !b.exact_match
    ) {
      return -1;
    }

    if (
      b.exact_match &&
      !a.exact_match
    ) {
      return 1;
    }

    return 0;
  });
}

function sortByPriority(
  results: PartialBookLookupResult[],
  priorities: readonly string[],
): PartialBookLookupResult[] {
  return priorities.flatMap(
    (priority) =>
      results.filter(
        (result) =>
          result.source ===
          priority,
      ),
  );
}

function prioritizeField(
  field:
    keyof typeof FIELD_PRIORITIES,
  results: PartialBookLookupResult[],
): PartialBookLookupResult[] {
  return sortByConfidence(
    sortByPriority(
      results,
      FIELD_PRIORITIES[
        field
      ],
    ),
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
      if (
        value === undefined ||
        value === null
      ) {
        return false;
      }

      if (
        typeof value ===
          "string" &&
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
        .flatMap(
          (result) =>
            result.subjects ??
            [],
        )
        .map((subject) =>
          subject.trim(),
        )
        .filter(Boolean),
    ),
  );

  return subjects.length
    ? subjects
    : undefined;
}

function pickMostCommon<T>(
  values: (
    | T
    | undefined
  )[],
): T | undefined {
  const counts = new Map<
    T,
    number
  >();

  for (const value of values) {
    if (
      value === undefined ||
      value === null
    ) {
      continue;
    }

    counts.set(
      value,
      (counts.get(value) ??
        0) + 1,
    );
  }

  let best:
    | T
    | undefined;

  let highest = 0;

  for (const [
    value,
    count,
  ] of counts.entries()) {
    if (count > highest) {
      best = value;
      highest = count;
    }
  }

  return best;
}

export async function mergeLookupResults(
  isbn: string,
  results: PartialBookLookupResult[],
): Promise<BookLookupResult | null> {
  if (!results.length) {
    return null;
  }

  const title = pickFirst(
    prioritizeField(
      "title",
      results,
    ),
    (result) =>
      result.title,
  );

  if (!title) {
    return null;
  }

  const author = pickFirst(
    prioritizeField(
      "author",
      results,
    ),
    (result) =>
      result.author,
  );

  const description =
    pickFirst(
      prioritizeField(
        "description",
        results,
      ),
      (result) =>
        result.description,
    )?.slice(0, 5000);

  const cover_url =
    await resolveCoverUrl(
      isbn,
      prioritizeField(
        "cover_url",
        results,
      ),
    );

  const subtitle =
    pickFirst(
      sortByConfidence(
        results,
      ),
      (result) =>
        result.subtitle,
    );

  const total_pages =
    pickMostCommon(
      results.map(
        (result) =>
          result.total_pages,
      ),
    );

  const publisher =
    pickMostCommon(
      results.map(
        (result) =>
          result.publisher,
      ),
    );

  const published_year =
    pickMostCommon(
      results.map(
        (result) =>
          result.published_year,
      ),
    );

  const language =
    pickMostCommon(
      results.map(
        (result) =>
          result.language,
      ),
    );

  const series =
    pickFirst(
      sortByConfidence(
        results,
      ),
      (result) =>
        result.series,
    );

  const subjects =
    mergeSubjects(results);

  const sources =
    Array.from(
      new Set(
        results.map(
          (result) =>
            result.source,
        ),
      ),
    );

  const source =
    sources.length > 1
      ? "merged"
      : sources[0];

  // Optional debugging
  console.log({
    isbn,

    totalResults:
      results.length,

    exactMatches:
      results.filter(
        (result) =>
          result.exact_match,
      ).length,

    fuzzyMatches:
      results.filter(
        (result) =>
          !result.exact_match,
      ).length,

    sources,
  });

  const parsed =
    bookLookupResultSchema.safeParse(
      {
        title,
        author,

        isbn,

        subtitle,

        cover_url,

        total_pages,

        publisher,

        published_year,

        language,

        series,

        description,

        subjects,

        source,

        sources,
      },
    );

  if (!parsed.success) {
    console.error(
      "Failed to merge lookup results",
      parsed.error,
    );

    return null;
  }

  return parsed.data;
}