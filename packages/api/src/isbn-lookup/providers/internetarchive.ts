import type {
  PartialBookLookupResult,
} from "../shared/types";

const INTERNET_ARCHIVE_API =
  "https://archive.org/advancedsearch.php";

type InternetArchiveResponse = {
  response?: {
    docs?: Array<{
      title?: string;
      creator?: string | string[];
      description?: string;
      language?: string | string[];
      publisher?: string;
      year?: number;
      identifier?: string;
    }>;
  };
};

function firstValue(
  value?: string | string[],
): string | undefined {
  if (!value) {
    return undefined;
  }

  return Array.isArray(value)
    ? value[0]
    : value;
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

    const doc = data.response?.docs?.[0];

    if (!doc) {
      return null;
    }

    const identifier = firstValue(doc.identifier);

    const cover_url = identifier
      ? `https://archive.org/download/${identifier}/page/n1_w360.jpg`
      : undefined;

    return {
      source: "internetarchive",
      title: doc.title,
      author: firstValue(doc.creator),
      description: doc.description,
      language: firstValue(doc.language),
      publisher: doc.publisher,
      published_year: doc.year,
      isbn,
      cover_url,
    };
  } catch {
    return null;
  }
}