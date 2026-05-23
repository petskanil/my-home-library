"use client";

import { useMemo, useState } from "react";
import { filterOwnedBooks } from "@home-library/shared";
import { useBookMutations, useBooksQuery } from "@/hooks/use-books";
import { BookList } from "@/components/book-list";
import { ReadingActions } from "@/components/reading-actions";

export default function ReadingPage() {
  const [search, setSearch] = useState("");
  const { data: books, isLoading } = useBooksQuery();
  const { update } = useBookMutations();

  const readingBooks = useMemo(
    () => filterOwnedBooks(books ?? [], "reading", search),
    [books, search],
  );

  return (
    <div className="space-y-6">
      <div className="border-l-2 border-gold pl-4">
        <h1 className="page-title">Currently reading</h1>
        <p className="page-subtitle">Track progress on books you are actively reading.</p>
      </div>
      <input
        type="search"
        placeholder="Search by title or author…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input-field max-w-md"
      />
      {isLoading ? (
        <p className="text-parchment-muted italic">Loading reading list…</p>
      ) : (
        <BookList
          books={readingBooks}
          emptyMessage="No volumes are currently marked as reading."
          renderActions={(book) => <ReadingActions book={book} update={update} />}
        />
      )}
    </div>
  );
}
