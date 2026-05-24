import { normalizeIsbn } from "@home-library/shared";
import { NB_ITEMS } from "../shared/base-urls";
import { NbItem, PartialBookLookupResult } from "../shared/types";

export async function lookupFromNb(isbn: string): Promise<PartialBookLookupResult | null> {
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