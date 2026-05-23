ALTER TABLE public.books
  ADD COLUMN publisher TEXT,
  ADD COLUMN published_year INTEGER,
  ADD COLUMN language TEXT,
  ADD COLUMN series TEXT,
  ADD COLUMN subjects TEXT[];

CREATE INDEX books_published_year_idx ON public.books (user_id, published_year);
CREATE INDEX books_language_idx ON public.books (user_id, language);
