CREATE TABLE IF NOT EXISTS public.water_observations (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  location_id integer NOT NULL REFERENCES public.locations(id) ON DELETE RESTRICT,
  user_id integer NOT NULL,
  kind text NOT NULL CHECK (kind IN ('tap','well','spring','other')),
  directions text NOT NULL CHECK (length(directions) BETWEEN 1 AND 1000),
  availability text NOT NULL CHECK (availability IN ('available','unavailable','unknown')),
  observed_on date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS water_observations_location_date
  ON public.water_observations(location_id, observed_on DESC, created_at DESC);
