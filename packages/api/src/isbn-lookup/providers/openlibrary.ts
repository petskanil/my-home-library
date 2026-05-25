import {
  isbn10ToIsbn13,
} from "@home-library/shared";

import { OPEN_LIBRARY } from "../shared/base-urls";
import { dedupeIsbns } from "../shared/isbn";

import {
  PartialBookLookupResult,
} from "../shared/types";

type OpenLibraryEntry = {
  identifiers?: {
    isbn_10?: string[];
    isbn_13?: string[];
  };

  url?: string;

  key?: string;

  title?: string;

  subtitle?: string;

  authors?: {
    name?: string;
    url?: string;
  }[];

  cover?: {
    small?: string;
    medium?: string;
    large?: string;
  };

  number_of_pages?: number;

  publishers?: {
    name?: string;
  }[];

  publish_date?: string;

  languages?: {
    key?: string;
  }[];

  series?: string[];

  subjects?:
    | {
        name?: string;
      }[]
    | string[];

  description?:
    | string
    | {
        value?: string;
      };
};

type OpenLibraryResponse =
  Record<
    string,
    OpenLibraryEntry
  >;

function parsePublishedYear(
  publishDate?: string,
): number | undefined {
  if (!publishDate) {
    return undefined;
  }

  const match =
    publishDate.match(
      /\\b(19|20)\\d{2}\\b/,
    );

  return match
    ? Number(match[0])
    : undefined;
}

function cleanDescription(
  description?:
    | string
    | {
        value?: string;
      },
): string | undefined {
  const value =
    typeof description ===
    "string"
      ? description
      : description?.value;

  if (!value) {
    return undefined;
  }

  return value
    .replace(/\\s+/g, " ")
    .trim()
    .slice(0, 5000);
}

function extractLanguage(
  languages?: {
    key?: string;
  }[],
): string | undefined {
  const values =
    languages
      ?.map((language) =>
        language.key
          ?.split("/")
          .pop(),
      )
      .filter(Boolean) ?? [];

  return values.length
    ? values.join(", ")
    : undefined;
}

function extractSubjects(
  subjects?:
    | {
        name?: string;
      }[]
    | string[],
): string[] | undefined {
  if (!subjects?.length) {
    return undefined;
  }

  const values = subjects
    .map((subject) =>
      typeof subject ===
      "string"
        ? subject
        : subject.name,
    )
    .filter(
      (
        subject,
      ): subject is string =>
        Boolean(subject),
    )
    .map((subject) =>
      subject.trim(),
    )
    .filter(Boolean);

  return values.length
    ? Array.from(
        new Set(values),
      )
    : undefined;
}

function extractRelatedIsbns(
  entry: OpenLibraryEntry,
): string[] {
  return dedupeIsbns([
    ...(entry.identifiers
      ?.isbn_10 ?? []),

    ...(entry.identifiers
      ?.isbn_13 ?? []),
  ]);
}

function resolveCoverUrl(
  cover?: {
    small?: string;
    medium?: string;
    large?: string;
  },
): string | undefined {
  const value =
    cover?.large ??
    cover?.medium ??
    cover?.small;

  return value?.replace(
    "http://",
    "https://",
  );
}

export async function lookupFromOpenLibrary(
  isbn: string,
): Promise<PartialBookLookupResult | null> {
  const isbn13 =
    isbn.length === 10
      ? isbn10ToIsbn13(
          isbn,
        )
      : isbn;

  const candidates =
    dedupeIsbns([
      isbn,
      isbn13,
    ]);

  const bibkeys =
    candidates
      .map(
        (candidate) =>
          `ISBN:${candidate}`,
      )
      .join(",");

  const url =
    `${OPEN_LIBRARY}?bibkeys=${encodeURIComponent(
      bibkeys,
    )}&format=json&jscmd=data`;

  const res = await fetch(
    url,
  );

  if (!res.ok) {
    return null;
  }

  const data =
    (await res.json()) as OpenLibraryResponse;

  const entry =
    data[`ISBN:${isbn}`] ??
    (isbn13
      ? data[
          `ISBN:${isbn13}`
        ]
      : undefined);

  if (!entry) {
    return null;
  }

  const title =
    entry.title?.trim();

  if (!title) {
    return null;
  }

  const author =
    entry.authors
      ?.map(
        (author) =>
          author.name?.trim(),
      )
      .filter(Boolean)
      .join(", ");

  const publisher =
    entry.publishers
      ?.map(
        (publisher) =>
          publisher.name?.trim(),
      )
      .filter(Boolean)
      .join(", ");

  const related_isbns =
    extractRelatedIsbns(
      entry,
    );

  const exact_match =
    related_isbns.includes(
      isbn,
    );

  return {
    source: "openlibrary",

    isbn,

    related_isbns,

    exact_match,

    confidence:
      exact_match
        ? 0.95
        : 0.7,

    provider_id:
      entry.key,

    title,

    subtitle:
      entry.subtitle?.trim(),

    author,

    cover_url:
      resolveCoverUrl(
        entry.cover,
      ),

    total_pages:
      entry.number_of_pages,

    publisher,

    published_year:
      parsePublishedYear(
        entry.publish_date,
      ),

    language:
      extractLanguage(
        entry.languages,
      ),

    series:
      entry.series?.[0]
        ?.trim(),

    subjects:
      extractSubjects(
        entry.subjects,
      ),

    description:
      cleanDescription(
        entry.description,
      ),
  };
}