export function marcSubfield(
  xml: string,
  tag: string,
  code: string,
): string | null {
  return (
    marcSubfields(xml, tag, code)[0] ?? null
  );
}

export function marcSubfields(
  xml: string,
  tag: string,
  code: string,
): string[] {
  const fieldRegex = new RegExp(
    `<datafield[^>]*tag="${tag}"[^>]*>([\\s\\S]*?)<\\/datafield>`,
    "gi",
  );

  const subfieldRegex = new RegExp(
    `<subfield code="${code}">([\\s\\S]*?)<\\/subfield>`,
    "gi",
  );

  const values: string[] = [];

  for (const fieldMatch of xml.matchAll(
    fieldRegex,
  )) {
    const fieldContent = fieldMatch[1];

    for (const subfieldMatch of fieldContent.matchAll(
      subfieldRegex,
    )) {
      const value = decodeMarcXml(
        subfieldMatch[1],
      )
        .replace(/\\s+/g, " ")
        .trim();

      if (value) {
        values.push(value);
      }
    }
  }

  return values;
}

export function cleanMarcValue(
  value?: string | null,
): string | undefined {
  if (!value) {
    return undefined;
  }

  return value
    .replace(/[\\/:;,]$/, "")
    .replace(/\\s+/g, " ")
    .trim();
}

export function extractMarcYear(
  value?: string | null,
): number | undefined {
  if (!value) {
    return undefined;
  }

  const match = value.match(/\\b(\\d{4})\\b/);

  if (!match) {
    return undefined;
  }

  return Number(match[1]);
}

function decodeMarcXml(
  value: string,
): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}