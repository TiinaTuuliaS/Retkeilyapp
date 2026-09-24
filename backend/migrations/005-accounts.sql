CREATE TABLE IF NOT EXISTS public.accounts (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email text NOT NULL UNIQUE,
  display_name text NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.account_sessions (
  token_hash text PRIMARY KEY,
  account_id integer NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS account_sessions_expiry ON public.account_sessions(expires_at);
CREATE TABLE IF NOT EXISTS public.saved_locations (
  account_id integer NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  location_id integer NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(account_id,location_id)
);
-- Legacy demo user_id values remain intact; account ownership is separate.
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS account_id integer REFERENCES public.accounts(id);
ALTER TABLE public.water_observations ADD COLUMN IF NOT EXISTS account_id integer REFERENCES public.accounts(id);
ALTER TABLE public.usage_observations ADD COLUMN IF NOT EXISTS account_id integer REFERENCES public.accounts(id);
CREATE INDEX IF NOT EXISTS reports_account ON public.reports(account_id);
CREATE INDEX IF NOT EXISTS water_account ON public.water_observations(account_id);
CREATE INDEX IF NOT EXISTS usage_account ON public.usage_observations(account_id);
