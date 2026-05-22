"use client";

import {
  createBookSchema,
  type BookLookupResult,
  type CreateBookInput,
  type Shelf,
} from "@home-library/shared";
import { useState } from "react";
import { IsbnLookupField } from "./isbn-lookup-field";

type BookFormProps = {
  initial?: Partial<CreateBookInput>;
  defaultShelf?: Shelf;
  onSubmit: (data: CreateBookInput) => Promise<void>;
  submitLabel?: string;
};

export function BookForm({
  initial,
  defaultShelf = "owned",
  onSubmit,
  submitLabel = "Save",
}: BookFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [author, setAuthor] = useState(initial?.author ?? "");
  const [isbn, setIsbn] = useState(initial?.isbn ?? "");
  const [coverUrl, setCoverUrl] = useState(initial?.cover_url ?? "");
  const [shelf, setShelf] = useState<Shelf>(initial?.shelf ?? defaultShelf);
  const [readStatus, setReadStatus] = useState(
    initial?.read_status ?? "unread",
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function applyLookup(result: BookLookupResult) {
    setTitle(result.title);
    setAuthor(result.author);
    setIsbn(result.isbn);
    if (result.cover_url) setCoverUrl(result.cover_url);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const raw = {
      title,
      author,
      isbn: isbn || undefined,
      cover_url: coverUrl || undefined,
      shelf,
      read_status: shelf === "owned" ? readStatus : undefined,
      notes: notes || undefined,
    };

    const parsed = createBookSchema.safeParse(raw);
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "Invalid input");
      setLoading(false);
      return;
    }

    try {
      await onSubmit(parsed.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 max-w-lg p-6">
      <IsbnLookupField
        isbn={isbn}
        onIsbnChange={setIsbn}
        onResult={applyLookup}
      />
      <div>
        <label className="block text-sm text-parchment-muted mb-1">Title *</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="input-field font-display text-lg"
        />
      </div>
      <div>
        <label className="block text-sm text-parchment-muted mb-1">Author *</label>
        <input
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          required
          className="input-field italic"
        />
      </div>
      <div>
        <label className="block text-sm text-parchment-muted mb-1">Cover URL</label>
        <input
          value={coverUrl}
          onChange={(e) => setCoverUrl(e.target.value)}
          type="url"
          className="input-field"
        />
      </div>
      <div>
        <label className="block text-sm text-parchment-muted mb-1">Shelf</label>
        <select
          value={shelf}
          onChange={(e) => setShelf(e.target.value as Shelf)}
          className="input-field"
        >
          <option value="owned">Owned (library)</option>
          <option value="wishlist">Wishlist</option>
        </select>
      </div>
      {shelf === "owned" && (
        <div>
          <label className="block text-sm text-parchment-muted mb-1">Read status</label>
          <select
            value={readStatus}
            onChange={(e) =>
              setReadStatus(e.target.value as "unread" | "reading" | "read")
            }
            className="input-field"
          >
            <option value="unread">Unread</option>
            <option value="reading">Reading</option>
            <option value="read">Read</option>
          </select>
        </div>
      )}
      <div>
        <label className="block text-sm text-parchment-muted mb-1">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="input-field resize-y min-h-[5rem]"
        />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2.5 rounded-md btn-primary disabled:opacity-50"
      >
        {loading ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
