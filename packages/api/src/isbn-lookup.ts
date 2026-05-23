import {
  bookLookupResultSchema,
  normalizeIsbn,
  type BookLookupResult,
} from "@home-library/shared";

const NB_ITEMS = "https://api.nb.no/catalog/v1/items";
const BIBSYS_SRU =
  "https://bibsys.alma.exlibrisgroup.com/view/sru/47BIBSYS_NETWORK";
const OPEN_LIBRARY = "https://openlibrary.org/api/books";

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

function formatAuthors(creators?: string[]): string {
  if (!creators?.length) return "Unknown author";
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

async function lookupFromNb(isbn: string): Promise<BookLookupResult | null> {
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

  if (!item?.metadata?.title) return null;

  return bookLookupResultSchema.parse({
    title: item.metadata.title,
    author: formatAuthors(item.metadata.creators),
    isbn,
    cover_url: resolveNbCover(item),
    source: "nb",
  });
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
): Promise<BookLookupResult | null> {
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

  if (!title || !author) return null;

  return bookLookupResultSchema.parse({
    title,
    author,
    isbn,
    source: "bibsys",
  });
}

async function lookupFromOpenLibrary(
  isbn: string,
): Promise<BookLookupResult | null> {
  const url = `${OPEN_LIBRARY}?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;
  const res = await fetch(url);
  if (!res.ok) return null;

  const data = (await res.json()) as Record<
    string,
    {
      title?: string;
      authors?: { name: string }[];
      cover?: { medium?: string; large?: string };
      number_of_pages?: number;
    }
  >;
  const entry = data[`ISBN:${isbn}`];
  if (!entry?.title) return null;

  const author =
    entry.authors?.map((a) => a.name).join(", ") || "Unknown author";

  return bookLookupResultSchema.parse({
    title: entry.title,
    author,
    isbn,
    cover_url: entry.cover?.medium ?? entry.cover?.large,
    total_pages: entry.number_of_pages,
    source: "openlibrary",
  });
}

/**
 * Look up book metadata by ISBN. Optimized for Norwegian books:
 * 1. Nasjonalbiblioteket (api.nb.no)
 * 2. BIBSYS / Norbok (national bibliography)
 * 3. Open Library (fallback)
 */
export async function lookupBookByIsbn(
  rawIsbn: string,
): Promise<BookLookupResult | null> {
  const isbn = normalizeIsbn(rawIsbn);
  if (!isbn) return null;

  const openlibrary = await lookupFromOpenLibrary(isbn);
  if (openlibrary) return openlibrary;

  const bibsys = await lookupFromBibsys(isbn);
  if (bibsys) return bibsys;

  return lookupFromNb(isbn);

}
