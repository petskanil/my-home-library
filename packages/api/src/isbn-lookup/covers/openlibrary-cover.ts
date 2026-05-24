import { isbn10ToIsbn13 } from "@home-library/shared";
import { imageExists } from "../shared/image-exists";

export async function fetchOpenLibraryCover(
  isbn: string,
): Promise<string | undefined> {
  const isbn13 = isbn.length === 10 ? isbn10ToIsbn13(isbn) : isbn;

  const candidates = [
    isbn,
    isbn13,
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    for (const size of ["L", "M", "S"]) {
      const url = `https://covers.openlibrary.org/b/isbn/${candidate}-${size}.jpg?default=false`;

      if (await imageExists(url)) {
        return url;
      }
    }
  }

  return undefined;
}