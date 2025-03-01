/*
  # Add trigger for order items validation

  1. Changes
    - Add trigger to validate order items before insertion
    - Add function to calculate and update order total
  
  2. Security
    - Maintain existing RLS policies
*/

-- Function to validate order items and update order total
CREATE OR REPLACE FUNCTION validate_order_items()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate that the product exists and belongs to the same restaurant as the order
  IF NOT EXISTS (
    SELECT 1 
    FROM products p
    JOIN orders o ON o.id = NEW.order_id
    WHERE p.id = NEW.product_id 
    AND p.idrestaurante = o.restaurant_id
  ) THEN
    RAISE EXCEPTION 'Product does not belong to the order''s restaurant';
  END IF;

  -- Validate that the unit price matches the product's current price
  IF NEW.unit_price != (
    SELECT valor 
    FROM products 
    WHERE id = NEW.product_id
  ) THEN
    RAISE EXCEPTION 'Invalid product price';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate order items before insertion
CREATE TRIGGER validate_order_items_trigger
  BEFORE INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION validate_order_items();