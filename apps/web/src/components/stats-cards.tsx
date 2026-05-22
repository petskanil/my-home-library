import type { LibraryStats } from "@home-library/shared";

export function StatsCards({ stats }: { stats: LibraryStats }) {
  const items = [
    { label: "Owned", value: stats.totalOwned },
    { label: "Unread", value: stats.unread },
    { label: "Reading", value: stats.reading },
    { label: "Read", value: stats.read },
    { label: "Wishlist", value: stats.wishlist },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {items.map((item) => (
        <div key={item.label} className="card p-4 text-center">
          <p className="font-display text-3xl font-semibold text-gold tabular-nums">
            {item.value}
          </p>
          <p className="text-xs uppercase tracking-widest text-parchment-muted mt-1">
            {item.label}
          </p>
        </div>
      ))}
    </div>
  );
}
