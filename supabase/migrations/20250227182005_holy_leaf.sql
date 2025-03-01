/*
  # Fix order reviews table

  1. Changes
     - Add ON CONFLICT DO UPDATE clause to the order_reviews RLS policy
     - Add policy for users to update their own reviews
     - Ensure proper constraints on order_reviews table
*/

-- First, ensure the order_reviews table has the correct constraints
DO $$
BEGIN
  -- Check if the unique constraint exists on order_id
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'order_reviews_order_id_key' 
    AND conrelid = 'order_reviews'::regclass
  ) THEN
    -- Add unique constraint if it doesn't exist
    ALTER TABLE order_reviews ADD CONSTRAINT order_reviews_order_id_key UNIQUE (order_id);
  END IF;
END $$;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can create reviews for their own orders" ON order_reviews;
DROP POLICY IF EXISTS "Users can read their own reviews" ON order_reviews;

-- Create policy for users to create reviews for their own orders
CREATE POLICY "Users can create reviews for their own orders"
  ON order_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_reviews.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Create policy for users to read their own reviews
CREATE POLICY "Users can read their own reviews"
  ON order_reviews
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policy for users to update their own reviews
CREATE POLICY "Users can update their own reviews"
  ON order_reviews
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_reviews.order_id
      AND orders.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_reviews.order_id
      AND orders.user_id = auth.uid()
    )
  );