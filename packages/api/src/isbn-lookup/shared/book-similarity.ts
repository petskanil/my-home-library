import { PartialBookLookupResult } from "./types";

function normalizeText(
  value?: string,
): string {
  if (!value) {
    return "";
  }

  return value
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function titlesSimilar(
  a?: string,
  b?: string,
): boolean {
  const left = normalizeText(a);
  const right = normalizeText(b);

  if (!left || !right) {
    return false;
  }

  return (
    left === right ||
    left.includes(right) ||
    right.includes(left)
  );
}

export function authorsSimilar(
  a?: string,
  b?: string,
): boolean {
  const left = normalizeText(a);
  const right = normalizeText(b);

  if (!left || !right) {
    return false;
  }

  return (
    left === right ||
    left.includes(right) ||
    right.includes(left)
  );
}

export function booksAreSimilar(
  base: PartialBookLookupResult,
  candidate: PartialBookLookupResult,
): boolean {
  const titleMatch =
    titlesSimilar(
      base.title,
      candidate.title,
    );

  const authorMatch =
    authorsSimilar(
      base.author,
      candidate.author,
    );

  const publisherMatch =
    normalizeText(
      base.publisher,
    ) ===
    normalizeText(
      candidate.publisher,
    );

  const yearDiff =
    base.published_year &&
    candidate.published_year
      ? Math.abs(
          base.published_year -
            candidate.published_year,
        )
      : undefined;

  return (
    titleMatch &&
    (authorMatch ||
      publisherMatch ||
      yearDiff === undefined ||
      yearDiff <= 2)
  );
}