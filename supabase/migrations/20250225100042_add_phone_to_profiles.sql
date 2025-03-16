-- Add phone field to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;

-- Update existing profiles with phone from user metadata
UPDATE profiles p
SET phone = au.raw_user_meta_data->>'phone'
FROM auth.users au
WHERE p.user_id = au.id
AND au.raw_user_meta_data->>'phone' IS NOT NULL; 