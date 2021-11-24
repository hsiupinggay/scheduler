CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  description TEXT,
  buyer_id INTEGER,
  weld_counter INTEGER,
  polish_counter INTEGER,
  weave_counter INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  client_po_no TEXT,
  shipment_date DATE,
  product_id INTEGER,
  quantity INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS schedule (
  id SERIAL PRIMARY KEY,
  order_id INTEGER,
  product_id INTEGER,
  weld_start DATE,
  weld_period_days INTEGER,
  polish_start DATE,
  polish_period_days INTEGER,
  weave_start DATE,
  weave_period_days INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS buyers (
  id SERIAL PRIMARY KEY,
  buyer_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);




