/*
  # Create orders table

  1. New Tables
    - `orders`
      - `id` (uuid, primary key)
      - `order_number` (bigint, unique, auto-incrementing)
      - `user_id` (uuid, foreign key to auth.users)
      - `restaurant_id` (uuid, foreign key to restaurants)
      - `total_amount` (numeric)
      - `delivery_fee` (numeric)
      - `delivery_type` (text)
      - `notes` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `orders` table
    - Add policies for authenticated users to:
      - Create their own orders
      - Read their own orders
*/

CREATE SEQUENCE IF NOT EXISTS order_number_seq;

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number bigint UNIQUE NOT NULL DEFAULT nextval('order_number_seq'),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id),
  total_amount numeric NOT NULL CHECK (total_amount >= 0),
  delivery_fee numeric NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
  delivery_type text NOT NULL CHECK (delivery_type IN ('delivery', 'pickup')),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create their own orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);