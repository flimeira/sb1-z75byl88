/*
  # Add delivery radius to restaurants

  1. Changes
    - Add delivery_radius column to restaurants table
    - Set default value of 5km
    - Add check constraint to ensure positive values
    
  2. Data Migration
    - Set default delivery radius for existing restaurants
*/

-- Add delivery_radius column with constraints
ALTER TABLE restaurants
ADD COLUMN delivery_radius numeric(10,2) NOT NULL DEFAULT 5.0
CHECK (delivery_radius > 0);

-- Add index for performance
CREATE INDEX idx_restaurants_delivery_radius ON restaurants(delivery_radius);

-- Update existing restaurants with varying delivery radius values
UPDATE restaurants
SET delivery_radius = 
  CASE 
    WHEN nome = 'Burger House' THEN 7.5
    WHEN nome = 'Sushi Master' THEN 5.0
    WHEN nome = 'Pizza Express' THEN 10.0
    ELSE 5.0
  END;