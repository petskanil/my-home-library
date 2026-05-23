ALTER TABLE public.books
  ADD COLUMN total_pages INTEGER;

ALTER TABLE public.books
  ADD CONSTRAINT books_total_pages_positive CHECK (
    total_pages IS NULL OR total_pages > 0
  );
