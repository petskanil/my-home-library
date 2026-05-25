import { dedupeIsbns } from "../shared/isbn";

import type {
  PartialBookLookupResult,
} from "../shared/types";

const INTERNET_ARCHIVE_API =
  "https://archive.org/advancedsearch.php";

type InternetArchiveDoc = {
  title?: unknown;

  creator?: unknown;

  description?: unknown;

  language?: unknown;

  publisher?: unknown;

  year?: unknown;

  identifier?: unknown;

  isbn?: unknown;

  subject?: unknown;
};

type InternetArchiveResponse = {
  response?: {
    docs?: InternetArchiveDoc[];
  };
};

function firstString(
  value: unknown,
): string | undefined {
  if (typeof value === "string") {
    return value.trim() || undefined;
  }

  if (Array.isArray(value)) {
    const first = value.find(
      (item) =>
        typeof item === "string" &&
        item.trim(),
    );

    return typeof first === "string"
      ? first.trim()
      : undefined;
  }

  return undefined;
}

function stringArray(
  value: unknown,
): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const values = value
    .filter(
      (item): item is string =>
        typeof item === "string",
    )
    .map((item) => item.trim())
    .filter(Boolean);

  return values.length
    ? values
    : undefined;
}

function safeNumber(
  value: unknown,
): number | undefined {
  if (typeof value === "number") {
    return value;
  }

  if (
    typeof value === "string" &&
    /^\\d+$/.test(value)
  ) {
    return Number(value);
  }

  return undefined;
}

function cleanDescription(
  description?: string,
): string | undefined {
  if (!description) {
    return undefined;
  }

  return description
    .replace(/\\s+/g, " ")
    .trim()
    .slice(0, 5000);
}

function extractRelatedIsbns(
  value: unknown,
): string[] {
  if (!value) {
    return [];
  }

  const raw = Array.isArray(value)
    ? value
    : [value];

  return dedupeIsbns(
    raw
      .filter(
        (item): item is string =>
          typeof item === "string",
      )
      .map((isbn) =>
        isbn.replace(/[^0-9X]/gi, ""),
      ),
  );
}

function resolveCoverUrl(
  identifier?: string,
): string | undefined {
  if (!identifier) {
    return undefined;
  }

  return `https://archive.org/download/${identifier}/page/n1_w360.jpg`;
}

export async function lookupFromInternetArchive(
  isbn: string,
): Promise<PartialBookLookupResult | null> {
  try {
    const params = new URLSearchParams({
      q: `isbn:${isbn}`,

      fl: [
        "title",
        "creator",
        "description",
        "language",
        "publisher",
        "year",
        "identifier",
        "isbn",
        "subject",
      ].join(","),

      rows: "1",

      output: "json",
    });

    const res = await fetch(
      `${INTERNET_ARCHIVE_API}?${params.toString()}`,
    );

    if (!res.ok) {
      return null;
    }

    const data =
      (await res.json()) as InternetArchiveResponse;

    const docs = Array.isArray(
      data?.response?.docs,
    )
      ? data.response.docs
      : [];

    const doc = docs[0];

    if (!doc) {
      return null;
    }

    const title = firstString(
      doc.title,
    );

    if (!title) {
      return null;
    }

    const author = firstString(
      doc.creator,
    );

    const description =
      cleanDescription(
        typeof doc.description ===
          "string"
          ? doc.description
          : firstString(
              (
                doc.description as {
                  value?: unknown;
                }
              )?.value,
            ),
      );

    const language = firstString(
      doc.language,
    );

    const publisher = firstString(
      doc.publisher,
    );

    const published_year = safeNumber(
      doc.year,
    );

    const provider_id = firstString(
      doc.identifier,
    );

    const subjects = stringArray(
      doc.subject,
    );

    const related_isbns =
      extractRelatedIsbns(doc.isbn);

    const exact_match =
      related_isbns.includes(isbn);

    return {
      source: "internetarchive",

      isbn,

      related_isbns,

      exact_match,

      confidence: exact_match
        ? 0.9
        : 0.65,

      provider_id,

      title,

      author,

      description,

      language,

      publisher,

      published_year,

      subjects,

      cover_url:
        resolveCoverUrl(provider_id),
    };
  } catch {
    return null;
  }
}