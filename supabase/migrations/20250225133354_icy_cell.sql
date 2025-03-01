/*
  # Add product categories

  1. New Tables
    - `product_categories`
      - `id` (uuid, primary key)
      - `restaurant_id` (uuid, foreign key to restaurants)
      - `name` (text)
      - `description` (text, optional)
      - `order` (integer) for sorting
      - `created_at` (timestamp)

  2. Changes
    - Add category_id to products table
    - Add foreign key constraint
    
  3. Security
    - Enable RLS on product_categories table
    - Add policy for public read access
*/

-- Create product categories table
CREATE TABLE IF NOT EXISTS product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id),
  name text NOT NULL,
  description text,
  "order" integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(restaurant_id, name)
);

-- Enable RLS
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access"
  ON product_categories
  FOR SELECT
  TO public
  USING (true);

-- Add category to products
ALTER TABLE products 
ADD COLUMN category_id uuid REFERENCES product_categories(id);

-- Create index for better performance
CREATE INDEX idx_products_category ON products(category_id);

-- Insert some sample categories
INSERT INTO product_categories (restaurant_id, name, "order")
SELECT 
  r.id,
  'Principais',
  0
FROM restaurants r
UNION ALL
SELECT 
  r.id,
  'Bebidas',
  1
FROM restaurants r
UNION ALL
SELECT 
  r.id,
  'Sobremesas',
  2
FROM restaurants r;

-- Update existing products to use the 'Principais' category
UPDATE products p
SET category_id = pc.id
FROM product_categories pc
WHERE pc.restaurant_id = p.idrestaurante
AND pc.name = 'Principais';