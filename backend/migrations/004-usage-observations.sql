CREATE TABLE IF NOT EXISTS public.usage_observations (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  location_id integer NOT NULL REFERENCES public.locations(id) ON DELETE RESTRICT,
  user_id integer NOT NULL,
  status text NOT NULL CHECK (status IN ('in_use','not_in_use','unknown')),
  comment text NOT NULL CHECK (length(comment) BETWEEN 1 AND 1000),
  observed_on date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS usage_observations_location_date
  ON public.usage_observations(location_id, observed_on DESC, created_at DESC);
