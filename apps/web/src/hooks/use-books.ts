"use client";

import {
  createBook,
  deleteBook,
  getBook,
  listBooks,
  moveToLibrary,
  setReadStatus,
  updateBook,
} from "@home-library/api";
import type { CreateBookInput, ReadStatus } from "@home-library/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

const BOOKS_KEY = ["books"] as const;

function getClient() {
  return createClient();
}

export function useBooksQuery() {
  return useQuery({
    queryKey: BOOKS_KEY,
    queryFn: () => listBooks(getClient()),
    onError: (err) => console.error("books query error:", err),
  });
}

export function useBookQuery(id: string) {
  return useQuery({
    queryKey: [...BOOKS_KEY, id],
    queryFn: () => getBook(getClient(), id),
    enabled: !!id,
  });
}

export function useBookMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: BOOKS_KEY });

  const create = useMutation({
    mutationFn: (input: CreateBookInput) => createBook(getClient(), input),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<CreateBookInput>;
    }) => updateBook(getClient(), id, input),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteBook(getClient(), id),
    onSuccess: invalidate,
  });

  const moveToOwned = useMutation({
    mutationFn: ({
      id,
      readStatus,
    }: {
      id: string;
      readStatus?: ReadStatus;
    }) => moveToLibrary(getClient(), id, readStatus),
    onSuccess: invalidate,
  });

  const updateReadStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ReadStatus }) =>
      setReadStatus(getClient(), id, status),
    onSuccess: invalidate,
  });

  return { create, update, remove, moveToOwned, updateReadStatus };
}
