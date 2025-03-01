/*
  # Create storage schema for image uploads

  1. New Tables
    - No new tables are created as Supabase Storage handles file storage

  2. Schema Updates
    - Add profile_image column to profiles table
    - Ensure products table has imagem column
    - Ensure restaurants table has imagem column

  3. Security
    - Set up storage bucket policies for authenticated users
*/

-- Add profile_image column to profiles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'profile_image'
  ) THEN
    ALTER TABLE profiles ADD COLUMN profile_image TEXT;
  END IF;
END $$;

-- Ensure products table has imagem column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'imagem'
  ) THEN
    ALTER TABLE products ADD COLUMN imagem TEXT;
  END IF;
END $$;

-- Ensure restaurants table has imagem column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurants' AND column_name = 'imagem'
  ) THEN
    ALTER TABLE restaurants ADD COLUMN imagem TEXT;
  END IF;
END $$;

-- Storage policies will be created programmatically via the API
-- The buckets will be:
-- 1. product-images
-- 2. restaurant-images
-- 3. profile-images