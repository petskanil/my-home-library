"use client";

import type { ReadStatus } from "@home-library/shared";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useBookMutations, useBookQuery } from "@/hooks/use-books";

const statusLabels: Record<ReadStatus, string> = {
  unread: "Unread",
  reading: "Reading",
  read: "Read",
};

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: book, isLoading } = useBookQuery(id);
  const { remove, updateReadStatus, moveToOwned } = useBookMutations();

  if (isLoading) return <p className="text-parchment-muted italic">Loading…</p>;
  if (!book) return <p className="text-danger">Volume not found.</p>;

  async function handleDelete() {
    if (!book || !confirm("Remove this volume from your catalogue?")) return;
    await remove.mutateAsync(book.id);
    router.push(book.shelf === "wishlist" ? "/wishlist" : "/library");
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Link
        href={book.shelf === "wishlist" ? "/wishlist" : "/library"}
        className="text-sm text-parchment-muted hover:text-gold transition-colors"
      >
        ← Return to shelves
      </Link>
      <div className="card flex gap-6 p-6">
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt=""
            className="w-32 h-48 object-cover rounded-sm ring-1 ring-border shadow-lg shrink-0"
          />
        ) : (
          <div className="w-32 h-48 rounded-sm bg-ink border border-border shrink-0" />
        )}
        <div>
          <h1 className="font-display text-3xl text-parchment">{book.title}</h1>
          <p className="text-parchment-muted italic mt-1">{book.author}</p>
          {book.isbn && (
            <p className="text-sm text-parchment-muted mt-2 font-mono">
              ISBN {book.isbn}
            </p>
          )}
          {book.shelf === "owned" && book.read_status && (
            <p className="mt-3 text-sm badge inline-block">
              {statusLabels[book.read_status]}
            </p>
          )}
        </div>
      </div>
      {book.notes && (
        <div className="card p-4">
          <h2 className="text-xs uppercase tracking-widest text-gold mb-2">Notes</h2>
          <p className="whitespace-pre-wrap text-parchment-muted italic leading-relaxed">
            {book.notes}
          </p>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/books/${book.id}/edit`}
          className="px-3 py-1.5 rounded-md btn-secondary text-sm"
        >
          Edit
        </Link>
        {book.shelf === "owned" &&
          (["unread", "reading", "read"] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() =>
                updateReadStatus.mutate({ id: book.id, status })
              }
              className={`px-3 py-1.5 rounded-md text-sm ${
                book.read_status === status ? "chip-active" : "chip-inactive"
              }`}
            >
              {statusLabels[status]}
            </button>
          ))}
        {book.shelf === "wishlist" && (
          <button
            type="button"
            onClick={() => moveToOwned.mutate({ id: book.id })}
            className="px-3 py-1.5 rounded-md btn-primary text-sm"
          >
            Add to library
          </button>
        )}
        <button
          type="button"
          onClick={handleDelete}
          className="px-3 py-1.5 rounded-md text-sm text-danger border border-burgundy/50 hover:bg-burgundy/20"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
