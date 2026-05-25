export function dedupeIsbns(
  isbns: (string | undefined | null)[],
): string[] {
  return Array.from(
    new Set(isbns.filter(Boolean)),
  ) as string[];
}

export function isValidIsbn13(
  isbn: string,
): boolean {
  if (!/^\d{13}$/.test(isbn)) {
    return false;
  }

  let sum = 0;

  for (let i = 0; i < 12; i++) {
    const digit = Number(isbn[i]);

    sum +=
      i % 2 === 0
        ? digit
        : digit * 3;
  }

  const checksum =
    (10 - (sum % 10)) % 10;

  return checksum === Number(isbn[12]);
}