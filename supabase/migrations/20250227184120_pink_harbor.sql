/*
  # Fix order reviews functionality

  1. Changes
    - Create a proper upsert_order_review function that handles both insert and update cases
    - Add proper error handling and validation
    - Ensure the function is secure and can only be called by authenticated users
    - Fix the return type to provide better feedback to the client
  
  2. Security
    - Function is marked as SECURITY DEFINER to run with the privileges of the creator
    - Added validation to ensure users can only review their own orders
*/

-- First drop the existing function if it exists
DROP FUNCTION IF EXISTS upsert_order_review(uuid, uuid, integer, text);

-- Create or replace the function to handle upsert operations for order reviews
CREATE OR REPLACE FUNCTION upsert_order_review(
  p_order_id UUID,
  p_user_id UUID,
  p_rating INTEGER,
  p_comment TEXT
) RETURNS JSONB AS $$
DECLARE
  v_review_id UUID;
  v_order_owner UUID;
BEGIN
  -- First, verify that the order exists and belongs to the user
  SELECT user_id INTO v_order_owner
  FROM orders
  WHERE id = p_order_id;
  
  IF v_order_owner IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Order not found'
    );
  END IF;
  
  IF v_order_owner != p_user_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'You can only review your own orders'
    );
  END IF;
  
  -- Validate rating
  IF p_rating < 1 OR p_rating > 5 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Rating must be between 1 and 5'
    );
  END IF;

  -- Try to insert a new review or update existing one
  INSERT INTO order_reviews (order_id, user_id, rating, comment)
  VALUES (p_order_id, p_user_id, p_rating, p_comment)
  ON CONFLICT (order_id) 
  DO UPDATE SET
    rating = p_rating,
    comment = p_comment,
    created_at = NOW()
  RETURNING id INTO v_review_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'review_id', v_review_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION upsert_order_review(UUID, UUID, INTEGER, TEXT) TO authenticated;

-- Add comment to explain function usage
COMMENT ON FUNCTION upsert_order_review IS 'Inserts or updates a review for an order. Only the order owner can review their orders.';