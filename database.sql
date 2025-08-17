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

CREATE TABLE IF NOT EXISTS stock_symbols (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL UNIQUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on display_order for faster sorting
CREATE INDEX IF NOT EXISTS idx_stock_symbols_display_order ON stock_symbols(display_order);

-- Insert default symbols with initial order
INSERT INTO stock_symbols (symbol, display_order) VALUES 
('TSLA', 0),
('NVDA', 1),
('CAI', 2),
('PACB', 3),
('CRCL', 4),
('TWST', 5),
('SOFI', 6),
('CRWV', 7),
('XYZ', 8),
('TTD', 9),
('BEAM', 10),
('AMD', 11),
('ROKU', 12),
('BLDE', 13),
('COIN', 14),
('JOBY', 15),
('GOOG', 16),
('CRSP', 17),
('PLTR', 18),
('RBLX', 19),
('DE', 20),
('LHX', 21),
('KTOS', 22),
('AVAV', 23),
('IRDM', 24),
('BMNR', 25),
('BLSH', 26),
('BWXT', 27),
('EXAS', 28),
('GH', 29),
('META', 30),
('ACHR', 31),
('ARKB', 32),
('DKNG', 33),
('CRM', 34),
('DASH', 35),
('TSM', 36),
('TER', 37)
ON CONFLICT (symbol) DO NOTHING;
