-- Create site-assets bucket if it doesn't exist
DO $$
BEGIN
  -- Create site-assets bucket
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'site-assets'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('site-assets', 'site-assets', true);
  END IF;
END $$;

-- Create RLS policies for the site-assets bucket
BEGIN;
  -- Allow public read access to site assets
  CREATE POLICY "Allow public read access to site assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'site-assets');

  -- Allow authenticated users to upload site assets
  CREATE POLICY "Allow authenticated users to upload site assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'site-assets' AND
    auth.role() = 'authenticated'
  );

  -- Allow authenticated users to update site assets
  CREATE POLICY "Allow authenticated users to update site assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'site-assets' AND
    auth.role() = 'authenticated'
  )
  WITH CHECK (
    bucket_id = 'site-assets' AND
    auth.role() = 'authenticated'
  );

  -- Allow authenticated users to delete site assets
  CREATE POLICY "Allow authenticated users to delete site assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'site-assets' AND
    auth.role() = 'authenticated'
  );
COMMIT;