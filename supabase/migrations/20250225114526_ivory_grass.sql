/*
  # Fix order validation trigger

  1. Changes
    - Update the validate_order_total function to run after each row instead of after statement
    - Add trigger for order total validation
    - Remove old trigger if it exists

  2. Security
    - Maintain RLS policies
    - Ensure data integrity with proper validation
*/

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS validate_order_total_trigger ON order_items;

-- Update the validation function to handle single row validation
CREATE OR REPLACE FUNCTION validate_order_total()
RETURNS TRIGGER AS $$
DECLARE
  order_total NUMERIC;
  items_total NUMERIC;
BEGIN
  -- Get the order's total amount
  SELECT total_amount INTO order_total
  FROM orders
  WHERE id = NEW.order_id;

  -- Calculate total from all order items including the new one
  SELECT COALESCE(SUM(quantity * unit_price), 0)
  INTO items_total
  FROM order_items
  WHERE order_id = NEW.order_id;

  -- Add the new item's total
  items_total := items_total + (NEW.quantity * NEW.unit_price);

  -- Verify if calculated total matches order total
  IF order_total != items_total THEN
    RAISE EXCEPTION 'Order total (%) does not match sum of order items (%)', 
      order_total, items_total;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create new trigger that runs for each row
CREATE TRIGGER validate_order_total_trigger
  BEFORE INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION validate_order_total();