"use client";

import { useState } from "react";
import type { Book, CreateBookInput } from "@home-library/shared";
import { useBookMutations } from "@/hooks/use-books";

export function ReadingActions({
  book,
  update,
}: {
  book: Book;
  update: ReturnType<typeof useBookMutations>["update"];
}) {
  const [page, setPage] = useState(book.progress_page?.toString() ?? "");
  const [percent, setPercent] = useState(book.progress_percent?.toString() ?? "");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  function computePercent(pageNumber: number, total: number) {
    return Math.min(100, Math.max(0, Math.round((pageNumber / total) * 100)));
  }

  function computePage(percentValue: number, total: number) {
    return Math.min(total, Math.max(0, Math.round((percentValue / 100) * total)));
  }

  function handlePageChange(value: string) {
    const pageNumber = value ? Number(value) : undefined;
    setPage(value);
    if (pageNumber !== undefined && book.total_pages != null && book.total_pages > 0) {
      setPercent(String(computePercent(pageNumber, book.total_pages)));
    } else {
      setPercent("");
    }
  }

  function handlePercentChange(value: string) {
    const percentValue = value ? Number(value) : undefined;
    setPercent(value);
    if (percentValue !== undefined && book.total_pages != null && book.total_pages > 0) {
      setPage(String(computePage(percentValue, book.total_pages)));
    } else {
      setPage("");
    }
  }

  async function handleSave() {
    const payload: Partial<CreateBookInput> = {};
    if (page.trim()) payload.progress_page = Number(page);
    if (percent.trim()) payload.progress_percent = Number(percent);

    if (!Object.keys(payload).length) {
      setStatus("Enter progress to save");
      return;
    }

    setSaving(true);
    try {
      await update.mutateAsync({ id: book.id, input: payload });
      setStatus("Saved");
      window.setTimeout(() => setStatus(""), 2000);
    } catch {
      setStatus("Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-3 shadow-[0_18px_45px_-24px_rgba(0,0,0,0.8)] sm:p-4">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] items-end">
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1 text-[0.72rem] text-parchment-muted">
            <span className="block text-xs uppercase tracking-[0.16em]">Page</span>
            <input
              type="number"
              min={0}
              value={page}
              onChange={(e) => handlePageChange(e.target.value)}
              className="input-field w-full py-2 text-sm"
            />
          </label>
          <label className="space-y-1 text-[0.72rem] text-parchment-muted">
            <span className="block text-xs uppercase tracking-[0.16em]">% complete</span>
            <input
              type="number"
              min={0}
              max={100}
              value={percent}
              onChange={(e) => handlePercentChange(e.target.value)}
              className="input-field w-full py-2 text-sm"
            />
          </label>
        </div>

        <div className="flex flex-col items-end gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-2 rounded-2xl btn-primary text-sm disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          {status ? <span className="text-xs text-parchment-muted">{status}</span> : null}
        </div>
      </div>
    </div>
  );
}
