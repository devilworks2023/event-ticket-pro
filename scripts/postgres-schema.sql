-- Esquema inicial (mínimo) para PostgreSQL.
-- Nota: este esquema no migra automáticamente los datos de Blink.

CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  email text NOT NULL,
  display_name text,
  role text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS events (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  title text NOT NULL,
  description text,
  date timestamptz NOT NULL,
  location text,
  image_url text,
  status text NOT NULL DEFAULT 'draft',
  transport_options jsonb,
  geography jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);

CREATE TABLE IF NOT EXISTS ticket_types (
  id text PRIMARY KEY,
  event_id text NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric(12,2) NOT NULL,
  quantity integer NOT NULL,
  sold integer NOT NULL DEFAULT 0,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ticket_types_event_id ON ticket_types(event_id);

CREATE TABLE IF NOT EXISTS sales (
  id text PRIMARY KEY,
  event_id text NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  ticket_type_id text NOT NULL REFERENCES ticket_types(id) ON DELETE RESTRICT,
  buyer_id text NOT NULL,
  seller_id text,
  amount numeric(12,2) NOT NULL,
  commission_amount numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  qr_code text,
  demographic_age integer,
  demographic_gender text,
  geography_city text,
  transport_added boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  stripe_session_id text
);

CREATE INDEX IF NOT EXISTS idx_sales_event_id ON sales(event_id);
