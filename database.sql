-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.daily_prices (
  symbol text NOT NULL,
  date date NOT NULL,
  price numeric NOT NULL,
  ts bigint,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT daily_prices_pkey PRIMARY KEY (symbol, date)
);
CREATE TABLE public.symbol_notes (
  symbol text NOT NULL,
  note text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT symbol_notes_pkey PRIMARY KEY (symbol)
);