/*
  # Create order reviews table

  1. New Tables
    - `order_reviews`
      - `id` (uuid, primary key)
      - `order_id` (uuid, references orders)
      - `user_id` (uuid, references auth.users)
      - `rating` (integer, 1-5)
      - `comment` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `order_reviews` table
    - Add policies for authenticated users to:
      - Create reviews for their own orders
      - Read their own reviews
*/

CREATE TABLE IF NOT EXISTS order_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders NOT NULL UNIQUE,
  user_id uuid REFERENCES auth.users NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_reviews ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Users can read their own reviews"
  ON order_reviews
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);