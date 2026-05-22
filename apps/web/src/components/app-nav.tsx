"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/", label: "Overview" },
  { href: "/library", label: "Library" },
  { href: "/wishlist", label: "Wishlist" },
];

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border/80 bg-wood/95 backdrop-blur-md">
      <div className="max-w-4xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="font-display text-2xl font-semibold tracking-wide text-parchment hover:text-gold transition-colors">
          Home Library
        </Link>
        <nav className="flex items-center gap-1 flex-wrap">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                pathname === link.href
                  ? "chip-active"
                  : "chip-inactive"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/books/new" className="ml-1 px-3 py-1.5 rounded-md text-sm btn-primary">
            Add book
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="ml-1 px-3 py-1.5 rounded-md text-sm text-parchment-muted hover:text-parchment transition-colors"
          >
            Sign out
          </button>
        </nav>
      </div>
    </header>
  );
}
