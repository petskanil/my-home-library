export function isbnSimilarity(
  a: string,
  b: string,
): number {
  let matches = 0;

  const length = Math.min(
    a.length,
    b.length,
  );

  for (let i = 0; i < length; i++) {
    if (a[i] === b[i]) {
      matches++;
    }
  }

  return matches / length;
}