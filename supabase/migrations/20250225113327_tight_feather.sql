/*
  # Convert deliveryFee from text to numeric

  1. Changes
    - Convert deliveryFee column from text to numeric
    - Set default value to 0
    - Add non-negative check constraint
    - Handle 'Free' values by converting to 0

  2. Security
    - No changes to RLS policies
*/

-- Create a new numeric column
ALTER TABLE restaurants 
ADD COLUMN delivery_fee_new numeric DEFAULT 0;

-- Update the new column using a DO block for safer type casting
DO $$
BEGIN
  UPDATE restaurants 
  SET delivery_fee_new = (
    CASE 
      WHEN deliveryFee::text = 'Free' THEN 0
      ELSE COALESCE(NULLIF(regexp_replace(deliveryFee::text, '[^0-9.]', '', 'g'), '')::numeric, 0)
    END
  );
END $$;

-- Drop the old column
ALTER TABLE restaurants 
DROP COLUMN deliveryFee;

-- Rename the new column
ALTER TABLE restaurants 
RENAME COLUMN delivery_fee_new TO deliveryFee;

-- Add constraints
ALTER TABLE restaurants 
ALTER COLUMN deliveryFee SET NOT NULL,
ADD CONSTRAINT check_delivery_fee_non_negative CHECK (deliveryFee >= 0);