import {
  isbn10ToIsbn13,
  type BookLookupResult,
} from "@home-library/shared";

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
      imageLinks?: {
        smallThumbnail?: string;
        thumbnail?: string;
        small?: string;
        medium?: string;
        large?: string;
        extraLarge?: string;
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

  const match = publishedDate.match(/\b(19|20)\d{2}\b/);

  return match ? Number(match[0]) : undefined;
}

export async function lookupFromGoogleBooks(
  isbn: string,
): Promise<PartialBookLookupResult | null> {
  const isbn13 =
    isbn.length === 10
      ? isbn10ToIsbn13(isbn)
      : isbn;

  const candidates = [
    isbn,
    isbn13,
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      const res = await fetch(
        `${GOOGLE_BOOKS}?q=isbn:${candidate}`,
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

      const cover =
        info.imageLinks?.extraLarge ??
        info.imageLinks?.large ??
        info.imageLinks?.medium ??
        info.imageLinks?.thumbnail ??
        info.imageLinks?.smallThumbnail ??
        (item.id
          ? `https://books.google.com/books/content?id=${item.id}&printsec=frontcover&img=1&zoom=1`
          : undefined);

      return {
        source: "googlebooks",
        title: info.title,
        subtitle: info.subtitle,
        author: info.authors?.join(", "),
        isbn,
        cover_url: cover?.replace(
          "http://",
          "https://",
        ),
        total_pages: info.pageCount,
        publisher: info.publisher,
        published_year: parsePublishedYear(
          info.publishedDate,
        ),
        language: info.language,
        subjects: info.categories,
        description: info.description,
      };
    } catch {
      // Ignore provider errors
    }
  }

  return null;
}