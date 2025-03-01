-- Create buckets if they don't exist
DO $$
BEGIN
  -- Create product-images bucket
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'product-images'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('product-images', 'product-images', true);
  END IF;

  -- Create restaurant-images bucket
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'restaurant-images'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('restaurant-images', 'restaurant-images', true);
  END IF;

  -- Create profile-images bucket
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'profile-images'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('profile-images', 'profile-images', true);
  END IF;
END $$;

-- Create RLS policies for the buckets
-- Note: We're using the proper API for creating policies in Supabase
COMMENT ON TABLE storage.buckets IS 'Storage buckets for file storage';
COMMENT ON TABLE storage.objects IS 'Storage objects (files) for file storage';

-- Product images bucket policies
BEGIN;
  -- Allow public read access to product images
  CREATE POLICY "Allow public read access to product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

  -- Allow authenticated users to upload product images
  CREATE POLICY "Allow authenticated users to upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images' AND
    auth.role() = 'authenticated'
  );

  -- Allow authenticated users to update product images
  CREATE POLICY "Allow authenticated users to update product images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'product-images' AND
    auth.role() = 'authenticated'
  )
  WITH CHECK (
    bucket_id = 'product-images' AND
    auth.role() = 'authenticated'
  );

  -- Allow authenticated users to delete product images
  CREATE POLICY "Allow authenticated users to delete product images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images' AND
    auth.role() = 'authenticated'
  );
COMMIT;

-- Restaurant images bucket policies
BEGIN;
  -- Allow public read access to restaurant images
  CREATE POLICY "Allow public read access to restaurant images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'restaurant-images');

  -- Allow authenticated users to upload restaurant images
  CREATE POLICY "Allow authenticated users to upload restaurant images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'restaurant-images' AND
    auth.role() = 'authenticated'
  );

  -- Allow authenticated users to update restaurant images
  CREATE POLICY "Allow authenticated users to update restaurant images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'restaurant-images' AND
    auth.role() = 'authenticated'
  )
  WITH CHECK (
    bucket_id = 'restaurant-images' AND
    auth.role() = 'authenticated'
  );

  -- Allow authenticated users to delete restaurant images
  CREATE POLICY "Allow authenticated users to delete restaurant images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'restaurant-images' AND
    auth.role() = 'authenticated'
  );
COMMIT;

-- Profile images bucket policies
BEGIN;
  -- Allow public read access to profile images
  CREATE POLICY "Allow public read access to profile images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-images');

  -- Allow authenticated users to upload their own profile images
  CREATE POLICY "Allow users to upload their own profile images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-images' AND
    auth.uid() = (storage.foldername(name))[1]::uuid
  );

  -- Allow authenticated users to update their own profile images
  CREATE POLICY "Allow users to update their own profile images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'profile-images' AND
    auth.uid() = (storage.foldername(name))[1]::uuid
  )
  WITH CHECK (
    bucket_id = 'profile-images' AND
    auth.uid() = (storage.foldername(name))[1]::uuid
  );

  -- Allow authenticated users to delete their own profile images
  CREATE POLICY "Allow users to delete their own profile images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'profile-images' AND
    auth.uid() = (storage.foldername(name))[1]::uuid
  );
COMMIT;