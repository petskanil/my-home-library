"use client";

import {
  filterOwnedBooks,
  type ReadFilter,
} from "@home-library/shared";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import { BookList } from "@/components/book-list";
import {
  useBookMutations,
  useBooksQuery,
} from "@/hooks/use-books";

export default function LibraryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const filter =
    (searchParams.get("filter") as ReadFilter | null) ??
    "all";

  const [search, setSearch] = useState("");

  const { data: books, isLoading } = useBooksQuery();

  const { updateReadStatus } = useBookMutations();

  const filtered = useMemo(
    () =>
      filterOwnedBooks(
        books ?? [],
        filter,
        search,
      ),
    [books, filter, search],
  );

  const filters: {
    value: ReadFilter;
    label: string;
  }[] = [
    { value: "all", label: "All" },
    { value: "unread", label: "Unread" },
    { value: "reading", label: "Reading" },
    { value: "read", label: "Read" },
  ];

  const setFilter = (value: ReadFilter) => {
    const params = new URLSearchParams(
      searchParams.toString(),
    );

    if (value === "all") {
      params.delete("filter");
    } else {
      params.set("filter", value);
    }

    const query = params.toString();

    router.replace(
      query
        ? `/library?${query}`
        : "/library",
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-l-2 border-gold pl-4">
        <div>
          <h1 className="page-title">
            Library
          </h1>

          <p className="page-subtitle">
            Volumes in your possession
          </p>
        </div>

        <Link
          href="/books/new?shelf=owned"
          className="text-sm px-3 py-1.5 rounded-md btn-primary"
        >
          Add volume
        </Link>
      </div>

      <input
        type="search"
        placeholder="Search by title or author…"
        value={search}
        onChange={(e) =>
          setSearch(e.target.value)
        }
        className="input-field max-w-md"
      />

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() =>
              setFilter(f.value)
            }
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              filter === f.value
                ? "chip-active"
                : "chip-inactive"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-parchment-muted italic">
          Loading shelves…
        </p>
      ) : (
        <BookList
          books={filtered}
          emptyMessage="Your library stands empty — add your first volume."
          renderActions={(book) => (
            <select
              value={
                book.read_status ?? "unread"
              }
              onChange={(e) =>
                updateReadStatus.mutate({
                  id: book.id,
                  status: e.target
                    .value as
                    | "unread"
                    | "reading"
                    | "read",
                })
              }
              className="text-xs rounded-md input-field py-1 max-w-[8rem]"
            >
              <option value="unread">
                Unread
              </option>

              <option value="reading">
                Reading
              </option>

              <option value="read">
                Read
              </option>
            </select>
          )}
        />
      )}
    </div>
  );
}