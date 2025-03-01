/*
  # Create products table for restaurants

  1. New Tables
    - `products`
      - `id` (uuid, primary key)
      - `nome` (text)
      - `descricao` (text)
      - `valor` (numeric)
      - `imagem` (text)
      - `idrestaurante` (uuid, foreign key to restaurants)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `products` table
    - Add policy for public read access
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text NOT NULL,
  valor numeric NOT NULL CHECK (valor >= 0),
  imagem text NOT NULL,
  idrestaurante uuid NOT NULL REFERENCES restaurants(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access"
  ON products
  FOR SELECT
  TO public
  USING (true);

-- Insert sample data
INSERT INTO products (nome, descricao, valor, imagem, idrestaurante)
SELECT 
  'Classic Cheeseburger',
  'Juicy beef patty with cheddar cheese, lettuce, tomato, and special sauce',
  12.99,
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80',
  restaurants.id
FROM restaurants WHERE nome = 'Burger House';

INSERT INTO products (nome, descricao, valor, imagem, idrestaurante)
SELECT 
  'Bacon Deluxe',
  'Double patty with crispy bacon, caramelized onions, and BBQ sauce',
  15.99,
  'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=500&q=80',
  restaurants.id
FROM restaurants WHERE nome = 'Burger House';

INSERT INTO products (nome, descricao, valor, imagem, idrestaurante)
SELECT 
  'California Roll',
  'Fresh crab, avocado, and cucumber wrapped in seaweed and rice',
  14.99,
  'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500&q=80',
  restaurants.id
FROM restaurants WHERE nome = 'Sushi Master';

INSERT INTO products (nome, descricao, valor, imagem, idrestaurante)
SELECT 
  'Margherita Pizza',
  'Fresh tomatoes, mozzarella, basil, and olive oil',
  16.99,
  'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500&q=80',
  restaurants.id
FROM restaurants WHERE nome = 'Pizza Express';