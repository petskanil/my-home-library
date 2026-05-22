"use client";

import type { CreateBookInput } from "@home-library/shared";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { BookForm } from "@/components/book-form";
import { useBookMutations, useBookQuery } from "@/hooks/use-books";

export default function EditBookPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: book, isLoading } = useBookQuery(id);
  const { update } = useBookMutations();

  if (isLoading) return <p className="text-parchment-muted italic">Loading…</p>;
  if (!book) return <p className="text-danger">Volume not found.</p>;

  const bookId = book.id;

  async function handleSubmit(data: CreateBookInput) {
    await update.mutateAsync({ id: bookId, input: data });
    router.push(`/books/${bookId}`);
  }

  return (
    <div className="space-y-6">
      <Link
        href={`/books/${book.id}`}
        className="text-sm text-parchment-muted hover:text-gold transition-colors"
      >
        ← Back
      </Link>
      <div className="border-l-2 border-gold pl-4">
        <h1 className="page-title">Edit volume</h1>
      </div>
      <BookForm
        initial={{
          title: book.title,
          author: book.author,
          isbn: book.isbn ?? undefined,
          cover_url: book.cover_url ?? undefined,
          shelf: book.shelf,
          read_status: book.read_status ?? undefined,
          notes: book.notes ?? undefined,
        }}
        onSubmit={handleSubmit}
        submitLabel="Update"
      />
    </div>
  );
}
