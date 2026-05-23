"use client";

import type { CreateBookInput, Shelf } from "@home-library/shared";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { BookForm } from "@/components/book-form";
import { useBookMutations } from "@/hooks/use-books";

function NewBookForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultShelf = (searchParams.get("shelf") as Shelf) || "owned";
  const { create } = useBookMutations();

  async function handleSubmit(data: CreateBookInput) {
    const book = await create.mutateAsync(data);
    router.push(`/books/${book.id}?created=true`);
  }

  return <BookForm defaultShelf={defaultShelf} onSubmit={handleSubmit} submitLabel="Catalogue volume" />;
}

export default function NewBookPage() {
  return (
    <div className="space-y-6">
      <div className="border-l-2 border-gold pl-4">
        <h1 className="page-title">Add volume</h1>
        <p className="page-subtitle">Record a new title in your collection</p>
      </div>
      <Suspense fallback={<p className="text-parchment-muted italic">Loading…</p>}>
        <NewBookForm />
      </Suspense>
    </div>
  );
}
