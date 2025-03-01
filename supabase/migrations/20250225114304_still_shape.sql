-- Remove delivery fee check constraint
ALTER TABLE orders
DROP CONSTRAINT IF EXISTS check_delivery_fee_non_negative;

-- Remove delivery fee column
ALTER TABLE orders
DROP COLUMN IF EXISTS delivery_fee;

-- Update order total validation function
CREATE OR REPLACE FUNCTION validate_order_total()
RETURNS TRIGGER AS $$
DECLARE
  calculated_total NUMERIC;
BEGIN
  -- Calculate total based on order items
  SELECT COALESCE(SUM(quantity * unit_price), 0)
  INTO calculated_total
  FROM order_items
  WHERE order_id = NEW.id;

  -- Verify if calculated total matches informed total
  IF NEW.total_amount != calculated_total THEN
    RAISE EXCEPTION 'Total amount (%) does not match sum of order items (%)', 
      NEW.total_amount, calculated_total;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;