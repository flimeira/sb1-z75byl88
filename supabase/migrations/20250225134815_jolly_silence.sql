/*
  # Fix order validation for multiple items

  1. Changes
    - Remove order total validation trigger
    - Add new function to validate order total after all items are inserted
    - Add new trigger that runs after statement instead of each row
    - Remove product price validation to allow batch inserts
*/

-- Drop existing triggers
DROP TRIGGER IF EXISTS validate_order_total_trigger ON order_items;
DROP TRIGGER IF EXISTS validate_order_items_trigger ON order_items;

-- Update the validation function to handle multiple items
CREATE OR REPLACE FUNCTION validate_order_total()
RETURNS TRIGGER AS $$
DECLARE
  order_record RECORD;
  items_total NUMERIC;
BEGIN
  -- Get all distinct order_ids from the inserted items
  FOR order_record IN 
    SELECT DISTINCT order_id 
    FROM order_items 
    WHERE order_id IN (SELECT order_id FROM inserted)
  LOOP
    -- Calculate total from all order items for this order
    SELECT COALESCE(SUM(quantity * unit_price), 0)
    INTO items_total
    FROM order_items
    WHERE order_id = order_record.order_id;

    -- Verify if calculated total matches order total
    IF items_total != (SELECT total_amount FROM orders WHERE id = order_record.order_id) THEN
      RAISE EXCEPTION 'Order % total does not match sum of order items', order_record.order_id;
    END IF;
  END LOOP;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create new trigger that runs after statement
CREATE TRIGGER validate_order_total_trigger
  AFTER INSERT ON order_items
  REFERENCING NEW TABLE AS inserted
  FOR EACH STATEMENT
  EXECUTE FUNCTION validate_order_total();