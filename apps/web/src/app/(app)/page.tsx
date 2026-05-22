"use client";

import { computeStats } from "@home-library/shared";
import Link from "next/link";
import { StatsCards } from "@/components/stats-cards";
import { useBooksQuery } from "@/hooks/use-books";

export default function HomePage() {
  const { data: books, isLoading, isError } = useBooksQuery();

  if (isLoading) {
    return <p className="text-parchment-muted italic">Opening the catalogue…</p>;
  }

  if (isError) {
    return <p className="text-danger">Could not load your library.</p>;
  }

  const stats = computeStats(books ?? []);

  return (
    <div className="space-y-8">
      <div className="border-l-2 border-gold pl-4">
        <h1 className="page-title">Overview</h1>
        <p className="page-subtitle mt-1">
          Your collection at a glance — volumes owned, read, and yet to acquire.
        </p>
      </div>
      <StatsCards stats={stats} />
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
