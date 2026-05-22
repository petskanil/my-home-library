"use client";

import type { Book } from "@home-library/shared";
import { BookCard } from "./book-card";

export function BookList({
  books,
  emptyMessage,
  renderActions,
}: {
  books: Book[];
  emptyMessage: string;
  renderActions?: (book: Book) => React.ReactNode;
}) {
  if (books.length === 0) {
    return (
      <p className="text-parchment-muted italic text-center py-12 font-display text-lg">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {books.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          actions={renderActions?.(book)}
        />
      ))}
    </div>
  );
}
