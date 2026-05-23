"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/", label: "Overview" },
  { href: "/library", label: "Library" },
  { href: "/reading", label: "Reading" },
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
    <>
      <header className="sticky top-0 z-30 border-b border-white/10 bg-card/95 backdrop-blur-xl shadow-[0_24px_80px_-48px_rgba(0,0,0,0.8)]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="font-display text-2xl font-semibold tracking-tight text-parchment hover:text-gold transition-colors"
          >
            Home Library
          </Link>
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1 shadow-[0_12px_30px_rgba(0,0,0,0.14)]">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  pathname === link.href
                    ? "border border-gold/30 bg-gold/10 text-gold"
                    : "border border-transparent bg-transparent text-parchment-muted hover:border-gold/20 hover:bg-white/10 hover:text-parchment"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/books/new"
              className="px-4 py-2 rounded-full text-sm font-semibold border border-gold/20 bg-gold/10 text-gold shadow-sm transition hover:bg-gold/15"
            >
              Add book
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="px-4 py-2 rounded-full text-sm font-medium text-parchment-muted border border-transparent bg-white/5 hover:text-parchment hover:border-gold/20 transition"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-card/95 backdrop-blur-xl sm:hidden">
        <nav className="safe-bottom-nav mx-auto flex max-w-4xl items-center justify-between gap-2 px-3 pt-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex-1 rounded-2xl border px-3 py-3 text-center text-[0.82rem] font-semibold transition ${
                pathname === link.href
                  ? "border-gold/25 bg-gold/10 text-gold"
                  : "border-white/10 bg-white/5 text-parchment-muted hover:border-gold/20 hover:bg-white/10 hover:text-parchment"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
