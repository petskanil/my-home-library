export function marcSubfield(xml: string, tag: string, code: string): string | null {
  const fieldRe = new RegExp(
    `<datafield[^>]*tag="${tag}"[\\s\\S]*?<\\/datafield>`,
    "i",
  );
  const field = xml.match(fieldRe)?.[0];
  if (!field) return null;
  const subRe = new RegExp(`<subfield code="${code}">([^<]*)`, "i");
  return field.match(subRe)?.[1]?.trim() ?? null;
}