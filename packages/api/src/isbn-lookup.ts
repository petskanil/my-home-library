import {
  bookLookupResultSchema,
  isbn10ToIsbn13,
  normalizeIsbn,
  type BookLookupResult,
} from "@home-library/shared";

const NB_ITEMS = "https://api.nb.no/catalog/v1/items";
const BIBSYS_SRU =
  "https://bibsys.alma.exlibrisgroup.com/view/sru/47BIBSYS_NETWORK";
const OPEN_LIBRARY = "https://openlibrary.org/api/books";

type BookLookupSource = "nb" | "bibsys" | "openlibrary";

type NbItem = {
  metadata?: {
    title?: string;
    creators?: string[];
    identifiers?: { isbn13?: string[] };
  };
  _links?: {
    thumbnail_medium?: { href?: string };
    thumbnail_large?: { href?: string };
  };
};

type PartialBookLookupResult = Partial<
  Omit<BookLookupResult, "source" | "sources">
> & { source: BookLookupSource };

function parsePublishedYear(publishDate?: string): number | undefined {
  if (!publishDate) return undefined;
  const match = publishDate.match(/\b(19|20)\d{2}\b/);
  return match ? Number(match[0]) : undefined;
}

function formatAuthors(creators?: string[]): string | undefined {
  if (!creators?.length) return undefined;
  return creators.join(", ");
}

function resolveNbCover(item: NbItem): string | undefined {
  const href =
    item._links?.thumbnail_medium?.href ??
    item._links?.thumbnail_large?.href;
  if (!href || href.includes("{")) return undefined;
  return href;
}

function isbnMatches(identifiers: string[] | undefined, isbn: string): boolean {
  if (!identifiers?.length) return false;
  const norm = normalizeIsbn(isbn);
  return identifiers.some((id) => normalizeIsbn(id) === norm);
}

async function lookupFromNb(isbn: string): Promise<PartialBookLookupResult | null> {
  const url = new URL(NB_ITEMS);
  url.searchParams.set("q", `${isbn} mediatype:bøker`);
  url.searchParams.set("size", "5");

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    _embedded?: { items?: NbItem[] };
  };
  const items = data._embedded?.items ?? [];
  const item =
    items.find((i) => isbnMatches(i.metadata?.identifiers?.isbn13, isbn)) ??
    items[0];
  if (!item) return null;

  const title = item.metadata?.title;
  const author = formatAuthors(item.metadata?.creators);
  const cover_url = resolveNbCover(item);

  if (!title && !author && !cover_url) return null;

  return {
    source: "nb",
    title,
    author,
    isbn,
    cover_url,
  };
}

function marcSubfield(xml: string, tag: string, code: string): string | null {
  const fieldRe = new RegExp(
    `<datafield[^>]*tag="${tag}"[\\s\\S]*?<\\/datafield>`,
    "i",
  );
  const field = xml.match(fieldRe)?.[0];
  if (!field) return null;
  const subRe = new RegExp(`<subfield code="${code}">([^<]*)`, "i");
  return field.match(subRe)?.[1]?.trim() ?? null;
}

async function lookupFromBibsys(
  isbn: string,
): Promise<PartialBookLookupResult | null> {
  if (isbn.length !== 13) return null;

  const url = new URL(BIBSYS_SRU);
  url.searchParams.set("version", "1.2");
  url.searchParams.set("operation", "searchRetrieve");
  url.searchParams.set("recordSchema", "marcxml");
  url.searchParams.set("query", `alma.isbn=${isbn}`);

  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const xml = await res.text();
  if (!xml.includes("<numberOfRecords>1</numberOfRecords>")) return null;

  const title =
    marcSubfield(xml, "245", "a") ?? marcSubfield(xml, "240", "a");
  const authorsFrom245 = marcSubfield(xml, "245", "c");
  const author =
    authorsFrom245 ??
    marcSubfield(xml, "100", "a") ??
    marcSubfield(xml, "700", "a");

  if (!title && !author) return null;

  return {
    source: "bibsys",
    title: title ?? undefined,
    author: author ?? undefined,
    isbn,
  };
}

async function lookupFromOpenLibrary(
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

async function fetchOpenLibraryCover(isbn: string): Promise<string | undefined> {
  const isbn13 = isbn.length === 10 ? isbn10ToIsbn13(isbn) : isbn;
  if (!isbn13) return undefined;

  const url = `https://covers.openlibrary.org/b/isbn/${isbn13}-L.jpg?default=false`;
  const res = await fetch(url, { method: "HEAD" });
  return res.ok ? url : undefined;
}

async function mergeLookupResults(
  isbn: string,
  results: PartialBookLookupResult[],
): Promise<BookLookupResult | null> {
  const title = results.find((result) => result.title)?.title;
  const author = results.find((result) => result.author)?.author;
  let cover_url = results.find((result) => result.cover_url)?.cover_url;
  const total_pages = results.find(
    (result) => result.total_pages !== undefined,
  )?.total_pages;
  const publisher = results.find((result) => result.publisher)?.publisher;
  const published_year = results.find(
    (result) => result.published_year !== undefined,
  )?.published_year;
  const language = results.find((result) => result.language)?.language;
  const series = results.find((result) => result.series)?.series;
  const subtitle = results.find((result) => result.subtitle)?.subtitle;
  const description = results.find((result) => result.description)?.description;
  const subjects = Array.from(
    new Set(
      results.flatMap((result) => result.subjects ?? []),
    ),
  );

  if (!title || !author) return null;

  if (!cover_url) {
    cover_url = await fetchOpenLibraryCover(isbn);
  }

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

/**
 * Look up book metadata by ISBN. Combines data from all available sources,
 * using each source to fill gaps for the richest possible result.
 */
export async function lookupBookByIsbn(
  rawIsbn: string,
): Promise<BookLookupResult | null> {
  const isbn = normalizeIsbn(rawIsbn);
  if (!isbn) return null;

  const [openlibrary, bibsys, nb] = await Promise.all([
    lookupFromOpenLibrary(isbn).catch(() => null),
    lookupFromBibsys(isbn).catch(() => null),
    lookupFromNb(isbn).catch(() => null),
  ]);

  const results = [openlibrary, bibsys, nb].filter(
    (result): result is PartialBookLookupResult => Boolean(result),
  );

  if (!results.length) return null;
  return mergeLookupResults(isbn, results);
}
