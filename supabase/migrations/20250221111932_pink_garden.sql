/*
  # Create tipos table for cuisine types

  1. New Tables
    - `tipos`
      - `id` (uuid, primary key)
      - `tipo` (text, unique) - The cuisine type name
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `tipos` table
    - Add policy for public read access
*/

CREATE TABLE IF NOT EXISTS tipos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE tipos ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access"
  ON tipos
  FOR SELECT
  TO public
  USING (true);

-- Insert initial cuisine types
INSERT INTO tipos (tipo) VALUES
  ('All'),
  ('American'),
  ('Japanese'),
  ('Italian'),
  ('Mexican'),
  ('Vietnamese'),
  ('Healthy')
ON CONFLICT (tipo) DO NOTHING;