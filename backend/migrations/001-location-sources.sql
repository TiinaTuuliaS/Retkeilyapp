-- Additive schema change for the limited LIPAS import.
CREATE TABLE IF NOT EXISTS public.location_sources (
  source text NOT NULL,
  source_collection text NOT NULL,
  source_id text NOT NULL,
  location_id integer NOT NULL REFERENCES public.locations(id) ON DELETE RESTRICT,
  source_url text NOT NULL,
  source_event_date timestamptz NOT NULL,
  fetched_at timestamptz NOT NULL,
  metadata jsonb NOT NULL,
  imported_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source, source_collection, source_id)
);
