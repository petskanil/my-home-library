import type { Book, ReadStatus } from "@home-library/shared";
import Link from "next/link";

const statusLabels: Record<ReadStatus, string> = {
  unread: "Unread",
  reading: "Reading",
  read: "Read",
};

const statusBadge: Record<ReadStatus, string> = {
  unread: "badge",
  reading: "badge-reading",
  read: "badge-read",
};

export function BookCard({
  book,
  actions,
}: {
  book: Book;
  actions?: React.ReactNode;
}) {
  return (
    <article className="card flex gap-4 p-4 transition-colors hover:border-gold-dim/40">
      {book.cover_url ? (
        <img
          src={book.cover_url}
          alt=""
          className="w-[4.5rem] h-[6.75rem] object-cover rounded-sm shrink-0 ring-1 ring-border shadow-md"
        />
      ) : (
        <div className="w-[4.5rem] h-[6.75rem] rounded-sm shrink-0 bg-ink border border-border flex items-center justify-center text-xs text-parchment-muted text-center px-1 font-display">
          No cover
        </div>
      )}
      <div className="flex-1 min-w-0">
        <Link
          href={`/books/${book.id}`}
          className="font-display text-lg text-parchment hover:text-gold transition-colors line-clamp-2"
        >
          {book.title}
        </Link>
        <p className="text-sm text-parchment-muted truncate mt-0.5 italic">
          {book.author}
        </p>
        {book.shelf === "owned" && book.read_status && (
          <span className={`inline-block mt-2 ${statusBadge[book.read_status]}`}>
            {statusLabels[book.read_status]}
          </span>
        )}
        {book.shelf === "wishlist" && (
          <span className="inline-block mt-2 badge-wishlist">Wishlist</span>
        )}
        {actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
      </div>
    </article>
  );
}
