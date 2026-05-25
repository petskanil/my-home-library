import { BIBSYS_SRU } from "../shared/base-urls";
import { dedupeIsbns } from "../shared/isbn";
import {
  cleanMarcValue,
  extractMarcYear,
  marcSubfield,
  marcSubfields,
} from "../shared/marc";
import { PartialBookLookupResult } from "../shared/types";

export async function lookupFromBibsys(
  isbn: string,
): Promise<PartialBookLookupResult | null> {
  if (isbn.length !== 13) {
    return null;
  }

  const url = new URL(BIBSYS_SRU);

  url.searchParams.set("version", "1.2");
  url.searchParams.set(
    "operation",
    "searchRetrieve",
  );
  url.searchParams.set(
    "recordSchema",
    "marcxml",
  );
  url.searchParams.set(
    "query",
    `alma.isbn=${isbn}`,
  );

  const res = await fetch(url.toString());

  if (!res.ok) {
    return null;
  }

  const xml = await res.text();

  // Only reject if NO records found
  if (
    xml.includes(
      "<numberOfRecords>0</numberOfRecords>",
    )
  ) {
    return null;
  }

  const title = cleanMarcValue(
    marcSubfield(xml, "245", "a") ??
      marcSubfield(xml, "240", "a"),
  );

  if (!title) {
    return null;
  }

  const subtitle = cleanMarcValue(
    marcSubfield(xml, "245", "b"),
  );

  const author = cleanMarcValue(
    marcSubfield(xml, "245", "c") ??
      marcSubfield(xml, "100", "a") ??
      marcSubfield(xml, "700", "a"),
  );

  const publisher = cleanMarcValue(
    marcSubfield(xml, "264", "b") ??
      marcSubfield(xml, "260", "b"),
  );

  const published_year = extractMarcYear(
    marcSubfield(xml, "264", "c") ??
      marcSubfield(xml, "260", "c"),
  );

  const language = cleanMarcValue(
    marcSubfield(xml, "041", "a"),
  );

  const description = cleanMarcValue(
    marcSubfield(xml, "520", "a"),
  );

  const series = cleanMarcValue(
    marcSubfield(xml, "490", "a") ??
      marcSubfield(xml, "830", "a"),
  );

  const subjects = Array.from(
    new Set(
      [
        ...marcSubfields(xml, "650", "a"),
        ...marcSubfields(xml, "651", "a"),
      ]
        .map(cleanMarcValue)
        .filter(Boolean),
    ),
  ) as string[];

  const related_isbns = dedupeIsbns(
    marcSubfields(xml, "020", "a").map(
      (value) =>
        value.replace(/[^0-9X]/gi, ""),
    ),
  );

  return {
    source: "bibsys",

    isbn,

    related_isbns,

    exact_match: related_isbns.includes(
      isbn,
    ),

    confidence: related_isbns.includes(
      isbn,
    )
      ? 1
      : 0.7,

    provider_id: isbn,

    title,
    subtitle,
    author,

    publisher,
    published_year,

    language,
    description,
    series,

    subjects,
  };
}