import {
  isbn10ToIsbn13,
} from "@home-library/shared";

import { dedupeIsbns } from "../shared/isbn";
import type {
  PartialBookLookupResult,
} from "../shared/types";

const GOOGLE_BOOKS =
  "https://www.googleapis.com/books/v1/volumes";

type GoogleBooksResponse = {
  items?: Array<{
    id?: string;

    volumeInfo?: {
      title?: string;
      subtitle?: string;

      authors?: string[];

      description?: string;

      pageCount?: number;

      publishedDate?: string;

      language?: string;

      categories?: string[];

      publisher?: string;

      industryIdentifiers?: Array<{
        type?: string;
        identifier?: string;
      }>;

      imageLinks?: {
        smallThumbnail?: string;
        thumbnail?: string;
        small?: string;
        medium?: string;
        large?: string;
        extraLarge?: string;
      };

      seriesInfo?: {
        bookDisplayNumber?: string;
        volumeSeries?: Array<{
          seriesId?: string;
          orderNumber?: number;
        }>;
      };
    };
  }>;
};

function parsePublishedYear(
  publishedDate?: string,
): number | undefined {
  if (!publishedDate) {
    return undefined;
  }

  const match = publishedDate.match(
    /\b(19|20)\d{2}\b/,
  );

  return match
    ? Number(match[0])
    : undefined;
}

function cleanDescription(
  description?: string,
): string | undefined {
  if (!description) {
    return undefined;
  }

  return description
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 5000);
}

function resolveCoverUrl(
  itemId?: string,
  imageLinks?: {
    smallThumbnail?: string;
    thumbnail?: string;
    small?: string;
    medium?: string;
    large?: string;
    extraLarge?: string;
  },
): string | undefined {
  const cover =
    imageLinks?.extraLarge ??
    imageLinks?.large ??
    imageLinks?.medium ??
    imageLinks?.thumbnail ??
    imageLinks?.smallThumbnail ??
    (itemId
      ? `https://books.google.com/books/content?id=${itemId}&printsec=frontcover&img=1&zoom=1`
      : undefined);

  return cover?.replace(
    "http://",
    "https://",
  );
}

function extractRelatedIsbns(
  identifiers?: Array<{
    type?: string;
    identifier?: string;
  }>,
): string[] {
  return dedupeIsbns(
    identifiers?.map((identifier) =>
      identifier.identifier?.replace(
        /[^0-9X]/gi,
        "",
      ),
    ) ?? [],
  );
}

export async function lookupFromGoogleBooks(
  isbn: string,
): Promise<PartialBookLookupResult | null> {
  const isbn13 =
    isbn.length === 10
      ? isbn10ToIsbn13(isbn)
      : isbn;

  const candidates = dedupeIsbns([
    isbn,
    isbn13,
  ]);

  for (const candidate of candidates) {
    try {
      const url = new URL(
        GOOGLE_BOOKS,
      );

      url.searchParams.set(
        "q",
        `isbn:${candidate}`,
      );

      const res = await fetch(
        url.toString(),
      );

      if (!res.ok) {
        continue;
      }

      const data =
        (await res.json()) as GoogleBooksResponse;

      const item = data.items?.[0];

      if (!item?.volumeInfo) {
        continue;
      }

      const info = item.volumeInfo;

      const related_isbns =
        extractRelatedIsbns(
          info.industryIdentifiers,
        );

      const exact_match =
        related_isbns.includes(isbn);

      const title =
        info.title?.trim();

      if (!title) {
        continue;
      }

      return {
        source: "googlebooks",

        isbn,

        related_isbns,

        exact_match,

        confidence: exact_match
          ? 1
          : 0.75,

        provider_id: item.id,

        title,

        subtitle:
          info.subtitle?.trim(),

        author:
          info.authors
            ?.map((author) =>
              author.trim(),
            )
            .filter(Boolean)
            .join(", ") || undefined,

        description:
          cleanDescription(
            info.description,
          ),

        total_pages:
          info.pageCount,

        published_year:
          parsePublishedYear(
            info.publishedDate,
          ),

        language:
          info.language,

        subjects:
          info.categories
            ?.map((category) =>
              category.trim(),
            )
            .filter(Boolean),

        publisher:
          info.publisher?.trim(),

        cover_url:
          resolveCoverUrl(
            item.id,
            info.imageLinks,
          ),
      };
    } catch {
      // Ignore provider errors
    }
  }

  return null;
}