import type { LibraryStats } from "@home-library/shared";

export function StatsCards({ stats }: { stats: LibraryStats }) {
  const items = [
    { label: "Owned", value: stats.totalOwned, path: "/library" },
    { label: "Unread", value: stats.unread, path: "/library?filter=unread" },
    { label: "Reading", value: stats.reading, path: "/reading" },
    { label: "Read", value: stats.read, path: "/library?filter=read" },
    { label: "Wishlist", value: stats.wishlist, path: "/wishlist" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {items.map((item) => (
  <button
    key={item.label}
    type="button"
    className="
      card
      p-4
      text-center
      cursor-pointer
      transition-all
      duration-150
      active:scale-[0.98]
      hover:-translate-y-[1px]
      hover:border-[rgba(176,141,87,0.18)]
      focus:outline-none
      focus:ring-2
      focus:ring-[rgba(176,141,87,0.22)]
    "
    onClick={() => {
      window.location.href = item.path;
    }}
  >
    <p className="font-display text-3xl font-semibold text-gold tabular-nums">
      {item.value}
    </p>

    <p className="text-xs uppercase tracking-widest text-parchment-muted mt-1">
      {item.label}
    </p>
  </button>
))}
    </div>
  );
}
