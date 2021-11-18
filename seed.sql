INSERT INTO products (
  description,
  buyer_id,
  welding_counter,
  polish_counter,
  weaving_counter
) VALUES ('montecito lounge chair', 1, 1, 1, 1), ('montecito sofa', 1, 1, 1, 1), ('montecito ottoman', 1, 1, 1, 1), ('soho lounge chair', 1, 1, 1, 1), ('soho sofa', 1, 1, 1, 1), ('soho ottoman', 1, 1, 1, 1);

INSERT INTO orders (
  client_po_no,
  product_id,
  shipment_date,
  quantity
);

-- INSERT INTO schedule (
--   order_id INTEGER,
--   product_id INTEGER,
--   welding_schedule DATE,
--   polishing_schedule DATE,
--   weaving_schedule DATE
-- );

INSERT INTO buyers (
  buyer_name
) VALUES ('summer classics'),('slettvoll'),('daro');



