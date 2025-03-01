/*
  # Create restaurants table and relationships

  1. New Tables
    - `restaurants`
      - `id` (uuid, primary key)
      - `nome` (text, not null)
      - `imagem` (text, not null)
      - `rating` (numeric, not null)
      - `deliveryTime` (text, not null)
      - `deliveryFee` (text, not null)
      - `idtipo` (uuid, foreign key to tipos.id)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `restaurants` table
    - Add policy for public read access
*/

CREATE TABLE IF NOT EXISTS restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  imagem text NOT NULL,
  rating numeric NOT NULL CHECK (rating >= 0 AND rating <= 5),
  deliveryTime text NOT NULL,
  deliveryFee text NOT NULL,
  idtipo uuid NOT NULL REFERENCES tipos(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access"
  ON restaurants
  FOR SELECT
  TO public
  USING (true);

-- Insert sample data
INSERT INTO restaurants (nome, imagem, rating, deliveryTime, deliveryFee, idtipo)
SELECT 
  'Burger House',
  'https://images.unsplash.com/photo-1586816001966-79b736744398?w=500&q=80',
  4.8,
  '25-35',
  'Free',
  tipos.id
FROM tipos WHERE tipo = 'American';

INSERT INTO restaurants (nome, imagem, rating, deliveryTime, deliveryFee, idtipo)
SELECT 
  'Sushi Master',
  'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500&q=80',
  4.9,
  '30-45',
  '$2.99',
  tipos.id
FROM tipos WHERE tipo = 'Japanese';

INSERT INTO restaurants (nome, imagem, rating, deliveryTime, deliveryFee, idtipo)
SELECT 
  'Pizza Express',
  'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500&q=80',
  4.7,
  '20-30',
  '$1.99',
  tipos.id
FROM tipos WHERE tipo = 'Italian';