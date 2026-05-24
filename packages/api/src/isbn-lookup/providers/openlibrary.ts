import { isbn10ToIsbn13 } from "@home-library/shared";
import { PartialBookLookupResult } from "../shared/types";
import { OPEN_LIBRARY } from "../shared/base-urls";

export async function lookupFromOpenLibrary(
  isbn: string,
): Promise<PartialBookLookupResult | null> {
  const isbn13 = isbn.length === 10 ? isbn10ToIsbn13(isbn) : isbn;
  const bibkeys = isbn13 && isbn.length === 10
    ? `ISBN:${isbn},ISBN:${isbn13}`
    : `ISBN:${isbn}`;

  const url = `${OPEN_LIBRARY}?bibkeys=${encodeURIComponent(
    bibkeys,
  )}&format=json&jscmd=data`;
  const res = await fetch(url);
  if (!res.ok) return null;

  const data = (await res.json()) as Record<
    string,
    {
      title?: string;
      subtitle?: string;
      authors?: { name: string }[];
      cover?: { medium?: string; large?: string };
      number_of_pages?: number;
      publishers?: { name?: string }[];
      publish_date?: string;
      languages?: { key?: string }[];
      series?: string[];
      subjects?: { name?: string }[] | string[];
      description?: string | { value?: string };
    }
  >;

  const entry = data[`ISBN:${isbn}`] ??
    (isbn13 ? data[`ISBN:${isbn13}`] : undefined);
  if (!entry) return null;

  const author =
    entry.authors?.map((a) => a.name).filter(Boolean).join(", ");
  const publisher = entry.publishers
    ?.map((p) => p.name)
    .filter(Boolean)
    .join(", ");
  const published_year = parsePublishedYear(entry.publish_date);
  const language = entry.languages
    ?.map((lang) => lang.key?.split("/").pop())
    .filter(Boolean)
    .join(", ");
  const series = entry.series?.[0];
  const subjects = entry.subjects
    ?.map((subject) =>
      typeof subject === "string" ? subject : subject.name ?? undefined,
    )
    .filter((subject): subject is string => Boolean(subject));
  const description =
    typeof entry.description === "string"
      ? entry.description
      : entry.description?.value;

  if (
    !entry.title &&
    !author &&
    !entry.cover &&
    entry.number_of_pages === undefined &&
    !publisher &&
    !published_year &&
    !language
  ) {
    return null;
  }

  return {
    source: "openlibrary",
    title: entry.title,
    author,
    isbn,
    cover_url: entry.cover?.large ?? entry.cover?.medium,
    total_pages: entry.number_of_pages,
    publisher,
    published_year,
    language,
    series,
    subjects,
    subtitle: entry.subtitle,
    description,
  };
}

function parsePublishedYear(publishDate?: string): number | undefined {
  if (!publishDate) return undefined;
  const match = publishDate.match(/\b(19|20)\d{2}\b/);
  return match ? Number(match[0]) : undefined;
}