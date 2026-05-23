"use client";

import { computeStats } from "@home-library/shared";
import Link from "next/link";
import { StatsCards } from "@/components/stats-cards";
import { BookList } from "@/components/book-list";
import { ReadingActions } from "@/components/reading-actions";
import { useBookMutations, useBooksQuery } from "@/hooks/use-books";

export default function HomePage() {
  const { data: books, isLoading, isError, error } = useBooksQuery();
  const { update } = useBookMutations();

  if (isLoading) {
    return <p className="text-parchment-muted italic">Opening the catalogue…</p>;
  }

  if (isError) {
    return (
      <div>
        <p className="text-danger">Could not load your library.</p>
        {error && (
          <pre className="text-xs mt-2 text-parchment-muted">{String(error?.message ?? error)}</pre>
        )}
      </div>
    );
  }

  const stats = computeStats(books ?? []);
  const readingBooks = (books ?? []).filter(
    (book) => book.shelf === "owned" && book.read_status === "reading",
  );

  return (
    <div className="space-y-8">
      <div className="border-l-2 border-gold pl-4">
        <h1 className="page-title">Overview</h1>
        <p className="page-subtitle mt-1">
          Your collection at a glance — volumes owned, read, and yet to acquire.
        </p>
      </div>
      <StatsCards stats={stats} />
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-l-2 border-gold pl-4">
          <div>
            <h2 className="page-title text-2xl">Currently reading</h2>
            <p className="page-subtitle mt-1">
              A quick view of the books you are actively reading.
            </p>
          </div>
          <Link href="/reading" className="px-4 py-2 rounded-full btn-secondary text-sm font-semibold">
            Open reading list
          </Link>
        </div>

        {readingBooks.length > 0 ? (
          <div className="space-y-3">
            <BookList
              books={readingBooks.slice(0, 3)}
              emptyMessage=""
              renderActions={(book) => <ReadingActions book={book} update={update} />}
            />
            {readingBooks.length > 3 ? (
              <p className="text-sm text-parchment-muted">
                Showing {Math.min(3, readingBooks.length)} of {readingBooks.length} books currently reading.
              </p>
            ) : null}
          </div>
        ) : (
          <div className="card p-5">
            <p className="text-parchment-muted">
              No books are currently marked as reading. Mark a title as reading in your library to have it appear here.
            </p>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/library" className="px-4 py-2 rounded-md btn-secondary text-sm">
          Browse library
        </Link>
        <Link href="/wishlist" className="px-4 py-2 rounded-md btn-secondary text-sm">
          View wishlist
        </Link>
        <Link href="/books/new" className="px-4 py-2 rounded-md btn-primary text-sm">
          Add a volume
        </Link>
      </div>
    </div>
  );
}
