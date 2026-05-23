import { z } from "zod";

export const shelfSchema = z.enum(["owned", "wishlist"]);
export const readStatusSchema = z.enum(["unread", "reading", "read"]);

export const bookSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string().min(1),
  author: z.string().min(1),
  isbn: z.string().nullable(),
  cover_url: z.string().nullable(),
  shelf: shelfSchema,
  read_status: readStatusSchema.nullable(),
  progress_page: z.number().int().nonnegative().nullable(),
  progress_percent: z.number().int().min(0).max(100).nullable(),
  total_pages: z.number().int().positive().nullable(),
  notes: z.string().nullable(),
  publisher: z.string().nullable(),
  published_year: z.number().int().positive().nullable(),
  language: z.string().nullable(),
  series: z.string().nullable(),
  subjects: z.array(z.string()).nullable(),
  acquired_at: z.string().nullable(),
  finished_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

const bookInputBaseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  isbn: z.string().optional(),
  cover_url: z.string().url().optional().or(z.literal("")),
  publisher: z.string().optional(),
  published_year: z.number().int().positive().optional(),
  language: z.string().optional(),
  series: z.string().optional(),
  subjects: z.array(z.string()).optional(),
  shelf: shelfSchema,
  read_status: readStatusSchema.optional(),
  progress_page: z.number().int().nonnegative().nullable().optional(),
  progress_percent: z.number().int().min(0).max(100).nullable().optional(),
  total_pages: z.number().int().positive().nullable().optional(),
  notes: z.string().optional(),
  acquired_at: z.string().optional(),
  finished_at: z.string().optional(),
});

export const createBookSchema = bookInputBaseSchema.superRefine((data, ctx) => {
  if (data.shelf === "wishlist" && data.read_status) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Wishlist books cannot have a read status",
      path: ["read_status"],
    });
  }
});

export const updateBookSchema = bookInputBaseSchema.partial().extend({
  id: z.string().uuid(),
});

export const readFilterSchema = z.enum(["all", "unread", "reading", "read"]);

export type Shelf = z.infer<typeof shelfSchema>;
export type ReadStatus = z.infer<typeof readStatusSchema>;
export type Book = z.infer<typeof bookSchema>;
export type CreateBookInput = z.infer<typeof bookInputBaseSchema>;
export type UpdateBookInput = z.infer<typeof updateBookSchema>;
export type ReadFilter = z.infer<typeof readFilterSchema>;

export type NormalizedBookInput = Omit<
  CreateBookInput,
  "read_status"
> & {
  read_status: ReadStatus | null;
};

export function normalizeCreateInput(
  input: CreateBookInput,
): NormalizedBookInput {
  const read_status =
    input.shelf === "wishlist" ? null : (input.read_status ?? "unread");
  return {
    ...input,
    isbn: input.isbn || undefined,
    cover_url: input.cover_url || undefined,
    publisher: input.publisher || undefined,
    published_year: input.published_year,
    language: input.language || undefined,
    series: input.series || undefined,
    subjects: input.subjects,
    notes: input.notes || undefined,
    read_status,
  };
}
export type LibraryStats = {
  totalOwned: number;
  unread: number;
  reading: number;
  read: number;
  wishlist: number;
};

export function computeStats(books: Book[]): LibraryStats {
  const owned = books.filter((b) => b.shelf === "owned");
  return {
    totalOwned: owned.length,
    unread: owned.filter((b) => b.read_status === "unread").length,
    reading: owned.filter((b) => b.read_status === "reading").length,
    read: owned.filter((b) => b.read_status === "read").length,
    wishlist: books.filter((b) => b.shelf === "wishlist").length,
  };
}

export function filterOwnedBooks(
  books: Book[],
  readFilter: ReadFilter,
  search?: string,
): Book[] {
  let result = books.filter((b) => b.shelf === "owned");
  if (readFilter !== "all") {
    result = result.filter((b) => b.read_status === readFilter);
  }
  if (search?.trim()) {
    const q = search.trim().toLowerCase();
    result = result.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q),
    );
  }
  return result.sort((a, b) => a.title.localeCompare(b.title));
}

export function filterWishlistBooks(books: Book[], search?: string): Book[] {
  let result = books.filter((b) => b.shelf === "wishlist");
  if (search?.trim()) {
    const q = search.trim().toLowerCase();
    result = result.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q),
    );
  }
  return result.sort((a, b) => a.title.localeCompare(b.title));
}
