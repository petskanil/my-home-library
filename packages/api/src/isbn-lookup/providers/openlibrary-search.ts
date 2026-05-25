import { PartialBookLookupResult } from "../shared/types";

const OPEN_LIBRARY_SEARCH =
  "https://openlibrary.org/search.json";

type OpenLibrarySearchDoc = {
  key?: string;

  title?: string;

  isbn?: string[];

  author_name?: string[];

  first_publish_year?: number;

  publisher?: string[];

  subject?: string[];
};

type OpenLibrarySearchResponse = {
  docs?: OpenLibrarySearchDoc[];
};

export async function searchOpenLibraryByTitle(
  title: string,
): Promise<
  PartialBookLookupResult[]
> {
  const url = new URL(
    OPEN_LIBRARY_SEARCH,
  );

  url.searchParams.set(
    "title",
    title,
  );

  const res = await fetch(
    url.toString(),
  );

  if (!res.ok) {
    return [];
  }

  const data =
    (await res.json()) as OpenLibrarySearchResponse;

  const docs = Array.isArray(
    data.docs,
  )
    ? data.docs
    : [];

  return docs
    .slice(0, 10)
    .map(
      (
        doc,
      ): PartialBookLookupResult => ({
        source: "openlibrary",

        isbn:
          doc.isbn?.[0] ??
          "unknown",

        related_isbns:
          doc.isbn ?? [],

        title: doc.title,

        author:
          doc.author_name?.join(
            ", ",
          ),

        published_year:
          doc.first_publish_year,

        publisher:
          doc.publisher?.[0],

        subjects:
          doc.subject,

        confidence: 0.5,

        exact_match: false,

        provider_id: doc.key,
      }),
    )
    .filter(
      (book) => Boolean(book.title),
    );
}