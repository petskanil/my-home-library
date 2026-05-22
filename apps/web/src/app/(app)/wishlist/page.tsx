"use client";

import { filterWishlistBooks } from "@home-library/shared";
import Link from "next/link";
import { useMemo, useState } from "react";
import { BookList } from "@/components/book-list";
import { useBookMutations, useBooksQuery } from "@/hooks/use-books";

export default function WishlistPage() {
  const [search, setSearch] = useState("");
  const { data: books, isLoading } = useBooksQuery();
  const { moveToOwned } = useBookMutations();

  const filtered = useMemo(
    () => filterWishlistBooks(books ?? [], search),
    [books, search],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-l-2 border-burgundy pl-4">
        <div>
          <h1 className="page-title">Wishlist</h1>
          <p className="page-subtitle">Titles you intend to acquire</p>
        </div>
        <Link
          href="/books/new?shelf=wishlist"
          className="text-sm px-3 py-1.5 rounded-md btn-primary"
        >
          Add to wishlist
        </Link>
      </div>
      <input
        type="search"
        placeholder="Search wishlist…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input-field max-w-md"
      />
      {isLoading ? (
        <p className="text-parchment-muted italic">Loading…</p>
      ) : (
        <BookList
          books={filtered}
          emptyMessage="Nothing on the wishlist yet — note a title to seek out."
          renderActions={(book) => (
            <button
              type="button"
              onClick={() => moveToOwned.mutate({ id: book.id })}
              disabled={moveToOwned.isPending}
              className="text-xs px-3 py-1.5 rounded-md btn-primary disabled:opacity-50"
            >
              Add to library
            </button>
          )}
        />
      )}
    </div>
  );
}
