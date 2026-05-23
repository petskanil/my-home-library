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
    <article className="card flex gap-4 p-5 rounded-[1.5rem] transition duration-200 hover:-translate-y-0.5 hover:border-gold/30">
      {book.cover_url ? (
        <img
          src={book.cover_url}
          alt=""
          className="w-[4.5rem] h-[6.75rem] object-cover rounded-xl shrink-0 ring-1 ring-white/5 shadow-lg"
        />
      ) : (
        <div className="w-[4.5rem] h-[6.75rem] rounded-xl shrink-0 bg-ink border border-white/10 flex items-center justify-center text-xs text-parchment-muted text-center px-1 font-display">
          No cover
        </div>
      )}
      <div className="flex-1 min-w-0">
        <Link
          href={`/books/${book.id}`}
          className="font-display text-xl text-parchment hover:text-gold transition-colors line-clamp-2"
        >
          {book.title}
        </Link>
        <p className="text-sm text-parchment-muted truncate mt-1 italic">
          {book.author}
        </p>
        {book.shelf === "owned" && book.read_status && (
          <span className={`inline-flex mt-3 ${statusBadge[book.read_status]}`}>
            {statusLabels[book.read_status]}
          </span>
        )}
        {book.shelf === "owned" && book.read_status === "reading" && (
          <p className="text-sm text-parchment-muted mt-3 leading-6">
            {book.progress_page != null && book.total_pages != null
              ? `Page ${book.progress_page} / ${book.total_pages}`
              : book.progress_page != null
                ? `Page ${book.progress_page}`
                : ""}
            {book.progress_page != null && book.progress_percent != null ? " · " : ""}
            {book.progress_percent != null && `${book.progress_percent}% finished`}
          </p>
        )}
        {book.shelf === "wishlist" && (
          <span className="inline-flex mt-3 badge-wishlist">Wishlist</span>
        )}
        {actions && <div className="mt-4 flex flex-wrap gap-2">{actions}</div>}
      </div>
    </article>
  );
}
