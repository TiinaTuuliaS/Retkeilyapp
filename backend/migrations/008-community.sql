ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS animal text NOT NULL DEFAULT '';
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('private','friends','public'));
CREATE TABLE IF NOT EXISTS public.friendships (
 sender integer NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
 recipient integer NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
 accepted boolean NOT NULL DEFAULT false,
 PRIMARY KEY(sender,recipient), CHECK(sender<>recipient)
);
CREATE UNIQUE INDEX IF NOT EXISTS friendship_pair ON public.friendships(LEAST(sender,recipient),GREATEST(sender,recipient));
CREATE TABLE IF NOT EXISTS public.trips (
 id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 owner integer NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
 title text NOT NULL, destination text NOT NULL, starts_on date NOT NULL,
 ends_on date NOT NULL, notes text NOT NULL DEFAULT '', CHECK(ends_on>=starts_on)
);
CREATE TABLE IF NOT EXISTS public.trip_members (
 trip_id integer NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
 account_id integer NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
 accepted boolean NOT NULL DEFAULT false,
 PRIMARY KEY(trip_id,account_id)
);
