/*
  # Fix order validation trigger

  1. Changes
    - Drop existing order validation triggers and functions
    - Create a new approach that doesn't validate order totals
    - This allows the application to handle the calculation logic
*/

-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS validate_order_total_trigger ON order_items;
DROP TRIGGER IF EXISTS validate_order_items_trigger ON order_items;
DROP FUNCTION IF EXISTS validate_order_total();
DROP FUNCTION IF EXISTS validate_order_items();

-- Create a simpler validation function that just checks product existence
CREATE OR REPLACE FUNCTION validate_order_items()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate that the product exists
  IF NOT EXISTS (
    SELECT 1 
    FROM products
    WHERE id = NEW.product_id
  ) THEN
    RAISE EXCEPTION 'Product does not exist';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger for basic validation
CREATE TRIGGER validate_order_items_trigger
  BEFORE INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION validate_order_items();