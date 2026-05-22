import {
  bookSchema,
  normalizeCreateInput,
  type Book,
  type CreateBookInput,
  type NormalizedBookInput,
  type ReadFilter,
  type ReadStatus,
  type Shelf,
  createBookSchema,
} from "@home-library/shared";
import type { SupabaseClient } from "./client";

type DbBook = {
  id: string;
  user_id: string;
  title: string;
  author: string;
  isbn: string | null;
  cover_url: string | null;
  shelf: Shelf;
  read_status: ReadStatus | null;
  notes: string | null;
  acquired_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
};

function parseBook(row: DbBook): Book {
  return bookSchema.parse({
    ...row,
    acquired_at: row.acquired_at,
    finished_at: row.finished_at,
  });
}

function toDbPayload(input: NormalizedBookInput, userId: string) {
  return {
    user_id: userId,
    title: input.title,
    author: input.author,
    isbn: input.isbn ?? null,
    cover_url: input.cover_url || null,
    shelf: input.shelf,
    read_status: input.read_status,
    notes: input.notes ?? null,
    acquired_at: input.acquired_at ?? null,
    finished_at: input.finished_at ?? null,
  };
}

export async function listBooks(client: SupabaseClient): Promise<Book[]> {
  const { data, error } = await client
    .from("books")
    .select("*")
    .order("title", { ascending: true });

  if (error) throw error;
  return (data as DbBook[]).map(parseBook);
}

export async function getBook(
  client: SupabaseClient,
  id: string,
): Promise<Book | null> {
  const { data, error } = await client
    .from("books")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return parseBook(data as DbBook);
}

export async function createBook(
  client: SupabaseClient,
  input: CreateBookInput,
): Promise<Book> {
  const parsed = createBookSchema.parse(input);
  const normalized = normalizeCreateInput(parsed);

  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await client
    .from("books")
    .insert(toDbPayload(normalized, user.id))
    .select("*")
    .single();

  if (error) throw error;
  return parseBook(data as DbBook);
}

export async function updateBook(
  client: SupabaseClient,
  id: string,
  input: Partial<CreateBookInput>,
): Promise<Book> {
  const patch: Record<string, unknown> = {};

  if (input.title !== undefined) patch.title = input.title;
  if (input.author !== undefined) patch.author = input.author;
  if (input.isbn !== undefined) patch.isbn = input.isbn ?? null;
  if (input.cover_url !== undefined) patch.cover_url = input.cover_url || null;
  if (input.notes !== undefined) patch.notes = input.notes ?? null;
  if (input.acquired_at !== undefined) patch.acquired_at = input.acquired_at ?? null;
  if (input.finished_at !== undefined) patch.finished_at = input.finished_at ?? null;

  if (input.shelf !== undefined) {
    patch.shelf = input.shelf;
    if (input.shelf === "wishlist") {
      patch.read_status = null;
    } else if (input.read_status === undefined && input.shelf === "owned") {
      const existing = await getBook(client, id);
      if (existing && existing.read_status === null) {
        patch.read_status = "unread";
      }
    }
  }

  if (input.read_status !== undefined) {
    patch.read_status = input.read_status ?? null;
  }

  const { data, error } = await client
    .from("books")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return parseBook(data as DbBook);
}

export async function deleteBook(
  client: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await client.from("books").delete().eq("id", id);
  if (error) throw error;
}

export async function moveToLibrary(
  client: SupabaseClient,
  id: string,
  readStatus: ReadStatus = "unread",
): Promise<Book> {
  return updateBook(client, id, {
    shelf: "owned",
    read_status: readStatus,
  });
}

export async function setReadStatus(
  client: SupabaseClient,
  id: string,
  readStatus: ReadStatus,
): Promise<Book> {
  const patch: Partial<CreateBookInput> = { read_status: readStatus };
  if (readStatus === "read") {
    patch.finished_at = new Date().toISOString().slice(0, 10);
  }
  return updateBook(client, id, patch);
}

export type ListBooksFilters = {
  shelf?: Shelf;
  readFilter?: ReadFilter;
};
