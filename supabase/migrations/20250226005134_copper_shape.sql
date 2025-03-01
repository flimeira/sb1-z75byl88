-- Add coordinates columns to profiles table
ALTER TABLE profiles
ADD COLUMN latitude numeric(10,8),
ADD COLUMN longitude numeric(11,8);

-- Add index for geolocation
CREATE INDEX idx_profiles_location ON profiles(latitude, longitude);

-- Update the handle_new_user function to initialize coordinates
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, latitude, longitude)
  VALUES (new.id, -23.5505, -46.6333); -- Default to São Paulo center
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;