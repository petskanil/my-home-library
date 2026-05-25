import { PartialBookLookupResult } from "../shared/types";

const OPEN_LIBRARY_SEARCH =
  "https://openlibrary.org/search.json";

type Response = {
  docs?: Array<{
    key?: string;

    title?: string;

    isbn?: string[];

    author_name?: string[];

    publisher?: string[];

    first_publish_year?: number;
  }>;
};

export async function searchOpenLibraryBroad(
  query: string,
): Promise<
  PartialBookLookupResult[]
> {
  const url = new URL(
    OPEN_LIBRARY_SEARCH,
  );

  url.searchParams.set(
    "q",
    query,
  );

  const res = await fetch(
    url.toString(),
  );

  if (!res.ok) {
    return [];
  }

  const data =
    (await res.json()) as Response;

  return (
    data.docs?.slice(0, 50).map(
      (doc) => ({
        source:
          "openlibrary",

        isbn:
          doc.isbn?.[0] ??
          query,

        related_isbns:
          doc.isbn ?? [],

        title: doc.title,

        author:
          doc.author_name?.join(
            ", ",
          ),

        publisher:
          doc.publisher?.[0],

        published_year:
          doc.first_publish_year,

        confidence: 0.1,

        exact_match: false,

        provider_id: doc.key,
      }),
    ) ?? []
  );
}