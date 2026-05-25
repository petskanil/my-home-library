import { normalizeIsbn } from "@home-library/shared";

import { NB_ITEMS } from "../shared/base-urls";
import { dedupeIsbns } from "../shared/isbn";

import {
  NbItem,
  PartialBookLookupResult,
} from "../shared/types";

type NbResponse = {
  _embedded?: {
    items?: NbItem[];
  };
};

function formatAuthors(
  creators?: string[],
): string | undefined {
  if (!creators?.length) {
    return undefined;
  }

  const authors = creators
    .map((creator) => creator.trim())
    .filter(Boolean);

  return authors.length
    ? authors.join(", ")
    : undefined;
}

function resolveNbCover(
  item: NbItem,
): string | undefined {
  const href =
    item._links?.thumbnail_large
      ?.href ??
    item._links?.thumbnail_medium
      ?.href;

  if (
    !href ||
    href.includes("{")
  ) {
    return undefined;
  }

  return href.replace(
    "http://",
    "https://",
  );
}

function isbnMatches(
  identifiers:
    | string[]
    | undefined,
  isbn: string,
): boolean {
  if (!identifiers?.length) {
    return false;
  }

  const normalized =
    normalizeIsbn(isbn);

  return identifiers.some(
    (identifier) =>
      normalizeIsbn(identifier) ===
      normalized,
  );
}

function extractRelatedIsbns(
  item: NbItem,
): string[] {
  return dedupeIsbns([
    ...(item.metadata
      ?.identifiers?.isbn10 ?? []),

    ...(item.metadata
      ?.identifiers?.isbn13 ?? []),
  ]);
}

export async function lookupFromNb(
  isbn: string,
): Promise<PartialBookLookupResult | null> {
  const url = new URL(
    NB_ITEMS,
  );

  url.searchParams.set(
    "q",
    `${isbn} mediatype:bøker`,
  );

  url.searchParams.set(
    "size",
    "10",
  );

  const res = await fetch(
    url.toString(),
    {
      headers: {
        Accept:
          "application/json",
      },
    },
  );

  if (!res.ok) {
    return null;
  }

  const data =
    (await res.json()) as NbResponse;

  const items =
    data._embedded?.items ??
    [];

  if (!items.length) {
    return null;
  }

  // Prefer exact ISBN match
  const item =
    items.find((candidate) =>
      isbnMatches(
        candidate.metadata
          ?.identifiers
          ?.isbn13,
        isbn,
      ),
    ) ?? items[0];

  if (!item) {
    return null;
  }

  const title =
    item.metadata?.title
      ?.trim();

  if (!title) {
    return null;
  }

  const author =
    formatAuthors(
      item.metadata
        ?.creators,
    );

  const related_isbns =
    extractRelatedIsbns(
      item,
    );

  const exact_match =
    related_isbns.includes(
      normalizeIsbn(isbn) ??
        isbn,
    );

  return {
    source: "nb",

    isbn,

    related_isbns,

    exact_match,

    confidence: exact_match
      ? 1
      : 0.8,

    provider_id:
      related_isbns[0] ??
      isbn,

    title,

    author,

    cover_url:
      resolveNbCover(item),
  };
}