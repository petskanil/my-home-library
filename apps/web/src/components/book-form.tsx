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
  const [publisher, setPublisher] = useState(initial?.publisher ?? "");
  const [publishedYear, setPublishedYear] = useState<number | undefined>(
    initial?.published_year ?? undefined,
  );
  const [language, setLanguage] = useState(initial?.language ?? "");
  const [series, setSeries] = useState(initial?.series ?? "");
  const [subjects, setSubjects] = useState<string[]>(initial?.subjects ?? []);
  const [shelf, setShelf] = useState<Shelf>(initial?.shelf ?? defaultShelf);
  const [readStatus, setReadStatus] = useState(
    initial?.read_status ?? "unread",
  );
  const [progressPage, setProgressPage] = useState<number | undefined>(
    initial?.progress_page ?? undefined,
  );
  const [progressPercent, setProgressPercent] = useState<number | undefined>(
    initial?.progress_percent ?? undefined,
  );
  const [totalPages, setTotalPages] = useState<number | undefined>(
    initial?.total_pages ?? undefined,
  );
  const [progressLastEdited, setProgressLastEdited] = useState<"page" | "percent" | null>(null);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function applyLookup(result: BookLookupResult) {
    setTitle(result.title);
    setAuthor(result.author);
    setIsbn(result.isbn);
    if (result.cover_url) setCoverUrl(result.cover_url);
    if (result.publisher) setPublisher(result.publisher);
    if (result.published_year !== undefined) setPublishedYear(result.published_year);
    if (result.language) setLanguage(result.language);
    if (result.series) setSeries(result.series);
    if (result.subjects) setSubjects(result.subjects);
    if (result.total_pages !== undefined) setTotalPages(result.total_pages);
  }

  function computePercent(page: number, total: number) {
    return Math.min(100, Math.max(0, Math.round((page / total) * 100)));
  }

  function computePage(percent: number, total: number) {
    return Math.min(total, Math.max(0, Math.round((percent / 100) * total)));
  }

  function handleProgressPageChange(value: string) {
    const page = value ? Number(value) : undefined;
    setProgressLastEdited("page");
    setProgressPage(page);
    if (page !== undefined && totalPages !== undefined && totalPages > 0) {
      setProgressPercent(computePercent(page, totalPages));
    } else {
      setProgressPercent(undefined);
    }
  }

  function handleProgressPercentChange(value: string) {
    const percent = value ? Number(value) : undefined;
    setProgressLastEdited("percent");
    setProgressPercent(percent);
    if (percent !== undefined && totalPages !== undefined && totalPages > 0) {
      setProgressPage(computePage(percent, totalPages));
    } else {
      setProgressPage(undefined);
    }
  }

  function handleTotalPagesChange(value: string) {
    const pages = value ? Number(value) : undefined;
    setTotalPages(pages);
    if (pages !== undefined && pages > 0) {
      if (progressLastEdited === "page" && progressPage !== undefined) {
        setProgressPercent(computePercent(progressPage, pages));
      } else if (progressLastEdited === "percent" && progressPercent !== undefined) {
        setProgressPage(computePage(progressPercent, pages));
      } else if (progressPage !== undefined) {
        setProgressPercent(computePercent(progressPage, pages));
      } else if (progressPercent !== undefined) {
        setProgressPage(computePage(progressPercent, pages));
      }
    }
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
      publisher: publisher || undefined,
      published_year: publishedYear,
      language: language || undefined,
      series: series || undefined,
      subjects: subjects.length ? subjects : undefined,
      shelf,
      read_status: shelf === "owned" ? readStatus : undefined,
      ...(shelf === "owned" && readStatus === "reading" && progressPage !== undefined
        ? { progress_page: progressPage }
        : {}),
      ...(shelf === "owned" && readStatus === "reading" && progressPercent !== undefined
        ? { progress_percent: progressPercent }
        : {}),
      ...(shelf === "owned" && readStatus === "reading" && totalPages !== undefined
        ? { total_pages: totalPages }
        : {}),
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
        {shelf === "owned" && readStatus === "reading" && (
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-sm text-parchment-muted mb-1">Current page</label>
              <input
                value={progressPage ?? ""}
                onChange={(e) => handleProgressPageChange(e.target.value)}
                type="number"
                min={0}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm text-parchment-muted mb-1">Percent complete</label>
              <input
                value={progressPercent ?? ""}
                onChange={(e) => handleProgressPercentChange(e.target.value)}
                type="number"
                min={0}
                max={100}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm text-parchment-muted mb-1">Total pages</label>
              <input
                value={totalPages ?? ""}
                onChange={(e) => handleTotalPagesChange(e.target.value)}
                type="number"
                min={1}
                className="input-field"
              />
            </div>
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
