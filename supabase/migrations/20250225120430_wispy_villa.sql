/*
  # Add delivery fee to restaurants

  1. Changes
    - Add delivery_fee column to restaurants table with numeric type and 2 decimal places
    - Add constraint to ensure delivery_fee is non-negative
    - Add default value of 0 for delivery_fee

  2. Security
    - No changes to RLS policies (using existing policies)
*/

-- Add delivery_fee column with proper constraints
ALTER TABLE restaurants
ADD COLUMN delivery_fee numeric(10,2) NOT NULL DEFAULT 0.00
CHECK (delivery_fee >= 0);

-- Add index for performance
CREATE INDEX idx_restaurants_delivery_fee ON restaurants(delivery_fee);