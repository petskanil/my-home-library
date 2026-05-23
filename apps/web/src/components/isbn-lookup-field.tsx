"use client";

import type { BookLookupResult } from "@home-library/shared";
import { useState } from "react";
import IsbnScanner from "./isbn-scanner";

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
  const [scanning, setScanning] = useState(false);

  async function fetchAndNotify(rawIsbn: string) {
    setMessage(null);
    setLoading(true);
    try {
      const encoded = encodeURIComponent(rawIsbn.trim());
      const res = await fetch(`/api/isbn/${encoded}`);
      const body = await res.json();
      if (!res.ok) {
        setMessage(body.error ?? "Lookup failed");
        return;
      }
      onResult(body as BookLookupResult);
      setMessage(
        body.total_pages
          ? `Found via ${
              body.source === "nb"
                ? "Nasjonalbiblioteket"
                : body.source === "bibsys"
                  ? "Norbok"
                  : body.source === "merged"
                    ? "multiple sources"
                    : "Open Library"
            }. ${body.total_pages} pages.`
          : `Found via ${
              body.source === "nb"
                ? "Nasjonalbiblioteket"
                : body.source === "bibsys"
                  ? "Norbok"
                  : body.source === "merged"
                    ? "multiple sources"
                    : "Open Library"
            }`,
      );
    } catch {
      setMessage("Could not look up ISBN");
    } finally {
      setLoading(false);
    }
  }

  async function handleLookup() {
    if (!isbn.trim()) return;
    await fetchAndNotify(isbn);
  }

  async function handleScan(isbnScanned: string) {
    setScanning(false);
    onIsbnChange(isbnScanned);
    await fetchAndNotify(isbnScanned);
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
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setScanning(true)}
            className="px-3 py-2 rounded-md btn-secondary text-sm whitespace-nowrap"
          >
            Scan
          </button>
          <button
            type="button"
            onClick={handleLookup}
            disabled={loading || !isbn.trim()}
            className="px-3 py-2 rounded-md btn-secondary text-sm whitespace-nowrap disabled:opacity-50"
          >
            {loading ? "…" : "Look up"}
          </button>
        </div>
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

      {scanning && <IsbnScanner onScan={handleScan} onClose={() => setScanning(false)} />}
    </div>
  );
}
