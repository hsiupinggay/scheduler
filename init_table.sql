CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  description TEXT,
  buyer_id INTEGER,
  welding_counter INTEGER,
  polish_counter INTEGER,
  weaving_counter INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  client_po_no TEXT,
  product_id INTEGER,
  shipment_date DATE,
  quantity INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS schedule (
  id SERIAL PRIMARY KEY,
  order_id INTEGER,
  product_id INTEGER,
  welding_schedule DATE,
  polishing_schedule DATE,
  weaving_schedule DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS buyers (
  id SERIAL PRIMARY KEY,
  buyer_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);




