"use client";

import type { BookLookupResult } from "@home-library/shared";
import { useState } from "react";

type IsbnLookupFieldProps = {
  isbn: string;
  onIsbnChange: (value: string) => void;
  onResult: (result: BookLookupResult) => void;
};

export function IsbnLookupField({
  isbn,
  onIsbnChange,
  onResult,
}: IsbnLookupFieldProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleLookup() {
    setMessage(null);
    setLoading(true);
    try {
      const encoded = encodeURIComponent(isbn.trim());
      const res = await fetch(`/api/isbn/${encoded}`);
      const body = await res.json();
      if (!res.ok) {
        setMessage(body.error ?? "Lookup failed");
        return;
      }
      onResult(body as BookLookupResult);
      setMessage(
        `Found via ${
          body.source === "nb"
            ? "Nasjonalbiblioteket"
            : body.source === "bibsys"
              ? "Norbok"
              : "Open Library"
        }`,
      );
    } catch {
      setMessage("Could not look up ISBN");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <label className="block text-sm text-parchment-muted mb-1">ISBN</label>
      <div className="flex gap-2">
        <input
          value={isbn}
          onChange={(e) => onIsbnChange(e.target.value)}
          placeholder="9788202560621"
          className="input-field flex-1"
        />
        <button
          type="button"
          onClick={handleLookup}
          disabled={loading || !isbn.trim()}
          className="px-3 py-2 rounded-md btn-secondary text-sm whitespace-nowrap disabled:opacity-50"
        >
          {loading ? "…" : "Look up"}
        </button>
      </div>
      <p className="text-xs text-parchment-muted mt-1 opacity-80">
        Norwegian sources first, then Open Library.
      </p>
      {message && (
        <p
          className={`text-xs mt-1 ${message.startsWith("Found") ? "text-success" : "text-danger"}`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
