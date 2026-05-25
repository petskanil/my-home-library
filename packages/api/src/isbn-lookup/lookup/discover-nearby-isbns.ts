export function discoverNearbyQueries(
  isbn: string,
): string[] {
  const queries = new Set<string>();

  queries.add(isbn);

  // Remove checksum
  queries.add(
    isbn.slice(0, -1),
  );

  // ISBN-10 body
  queries.add(
    isbn.slice(3, 12),
  );

  // Smaller chunks
  queries.add(
    isbn.slice(3, 10),
  );

  queries.add(
    isbn.slice(3, 9),
  );

  return Array.from(queries);
}