ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS bio text NOT NULL DEFAULT '';
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS avatar text NOT NULL DEFAULT '';
CREATE TABLE IF NOT EXISTS public.journal_entries (
 id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 account_id integer NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
 title text NOT NULL,
 visited_on date NOT NULL,
 place text NOT NULL DEFAULT '',
 body text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS journal_owner_date ON public.journal_entries(account_id, visited_on DESC, id DESC);
