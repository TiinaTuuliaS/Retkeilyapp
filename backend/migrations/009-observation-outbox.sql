CREATE TABLE IF NOT EXISTS public.observation_receipts (
 account_id integer NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
 request_id uuid NOT NULL,
 payload jsonb NOT NULL,
 response jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(account_id,request_id)
);
