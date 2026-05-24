import type {
  PartialBookLookupResult,
} from "../shared/types";

const INTERNET_ARCHIVE_API =
  "https://archive.org/advancedsearch.php";

function firstString(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    const first = value.find(
      (item) => typeof item === "string",
    );

    return typeof first === "string"
      ? first
      : undefined;
  }

  return undefined;
}

function safeNumber(value: unknown): number | undefined {
  return typeof value === "number"
    ? value
    : undefined;
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

    const text = await res.text();

    let data: any;

    try {
      data = JSON.parse(text);
    } catch {
      return null;
    }

    const docs = Array.isArray(data?.response?.docs)
      ? data.response.docs
      : [];

    const doc = docs[0];

    if (!doc || typeof doc !== "object") {
      return null;
    }

    const title = firstString(doc.title);

    const author = firstString(doc.creator);

    const description =
      typeof doc.description === "string"
        ? doc.description
        : firstString(doc.description?.value);

    const language = firstString(doc.language);

    const publisher = firstString(doc.publisher);

    const published_year = safeNumber(doc.year);

    const identifier = firstString(doc.identifier);

    const cover_url = identifier
      ? `https://archive.org/download/${identifier}/page/n1_w360.jpg`
      : undefined;

    if (
      !title &&
      !author &&
      !description &&
      !cover_url
    ) {
      return null;
    }

    return {
      source: "internetarchive",
      title,
      author,
      description,
      language,
      publisher,
      published_year,
      isbn,
      cover_url,
    };
  } catch {
    return null;
  }
}