ALTER TABLE public.books
ADD COLUMN progress_page integer,
ADD COLUMN progress_percent integer,
ADD CONSTRAINT books_progress_page_nonnegative
  CHECK (progress_page IS NULL OR progress_page >= 0),
ADD CONSTRAINT books_progress_percent_range
  CHECK (progress_percent IS NULL OR progress_percent BETWEEN 0 AND 100);
