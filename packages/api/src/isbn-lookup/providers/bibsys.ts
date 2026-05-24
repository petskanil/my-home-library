import { BIBSYS_SRU } from "../shared/base-urls";
import { marcSubfield } from "../shared/marc";
import { PartialBookLookupResult } from "../shared/types";

export async function lookupFromBibsys(
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