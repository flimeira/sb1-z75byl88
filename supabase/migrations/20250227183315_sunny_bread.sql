/*
  # Fix order reviews functionality

  1. Changes
     - Ensure proper constraints on order_reviews table
     - Fix RLS policies for order_reviews table
     - Add explicit ON CONFLICT handling for order reviews
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
DROP POLICY IF EXISTS "Users can update their own reviews" ON order_reviews;

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

-- Create a function to handle upsert operations for order reviews
CREATE OR REPLACE FUNCTION upsert_order_review(
  p_order_id UUID,
  p_user_id UUID,
  p_rating INTEGER,
  p_comment TEXT
) RETURNS UUID AS $$
DECLARE
  v_review_id UUID;
BEGIN
  -- Try to insert a new review
  INSERT INTO order_reviews (order_id, user_id, rating, comment)
  VALUES (p_order_id, p_user_id, p_rating, p_comment)
  ON CONFLICT (order_id) 
  DO UPDATE SET
    rating = p_rating,
    comment = p_comment,
    created_at = NOW()
  RETURNING id INTO v_review_id;
  
  RETURN v_review_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a policy to allow authenticated users to execute the function
CREATE POLICY "Allow authenticated users to execute upsert_order_review"
  ON order_reviews
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);