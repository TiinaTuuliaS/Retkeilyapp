ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS target text NOT NULL DEFAULT 'general'
  CHECK (target IN ('general', 'toilet', 'water'));
