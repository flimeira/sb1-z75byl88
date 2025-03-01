/*
  # Create feedbacks table

  1. New Tables
    - `feedbacks`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `rating` (integer, 1-5)
      - `comment` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `feedbacks` table
    - Add policies for authenticated users to:
      - Create their own feedback
      - Read their own feedback
*/

CREATE TABLE IF NOT EXISTS feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own feedback"
  ON feedbacks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own feedback"
  ON feedbacks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);