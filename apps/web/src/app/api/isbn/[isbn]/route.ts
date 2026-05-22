import { lookupBookByIsbn } from "@home-library/api";
import { normalizeIsbn } from "@home-library/shared";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ isbn: string }> },
) {
  const { isbn: raw } = await params;

  if (!normalizeIsbn(raw)) {
    return NextResponse.json({ error: "Invalid ISBN" }, { status: 400 });
  }

  const result = await lookupBookByIsbn(raw);
  if (!result) {
    return NextResponse.json(
      { error: "No book found for this ISBN" },
      { status: 404 },
    );
  }

  return NextResponse.json(result);
}
