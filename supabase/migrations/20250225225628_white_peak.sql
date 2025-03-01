/*
  # Add restaurant address information

  1. New Columns
    - Added address columns to restaurants table:
      - street (text)
      - number (text)
      - neighborhood (text)
      - city (text)
      - state (text)
      - postal_code (text)
      - latitude (numeric)
      - longitude (numeric)

  2. Changes
    - Added NOT NULL constraints for essential address fields
    - Added indexes for geolocation columns
    - Updated sample data with real addresses
*/

-- Add address columns to restaurants table
ALTER TABLE restaurants
ADD COLUMN street text NOT NULL DEFAULT '',
ADD COLUMN number text NOT NULL DEFAULT '',
ADD COLUMN neighborhood text,
ADD COLUMN city text NOT NULL DEFAULT '',
ADD COLUMN state text NOT NULL DEFAULT '',
ADD COLUMN postal_code text,
ADD COLUMN latitude numeric(10,8),
ADD COLUMN longitude numeric(11,8);

-- Add indexes for geolocation
CREATE INDEX idx_restaurants_location ON restaurants(latitude, longitude);

-- Update sample restaurants with real addresses
UPDATE restaurants
SET 
  street = 'Avenida Paulista',
  number = '1000',
  neighborhood = 'Bela Vista',
  city = 'São Paulo',
  state = 'SP',
  postal_code = '01310-100',
  latitude = -23.5653,
  longitude = -46.6556
WHERE nome = 'Burger House';

UPDATE restaurants
SET 
  street = 'Rua Augusta',
  number = '2000',
  neighborhood = 'Jardins',
  city = 'São Paulo',
  state = 'SP',
  postal_code = '01412-000',
  latitude = -23.5632,
  longitude = -46.6582
WHERE nome = 'Sushi Master';

UPDATE restaurants
SET 
  street = 'Rua Oscar Freire',
  number = '500',
  neighborhood = 'Jardins',
  city = 'São Paulo',
  state = 'SP',
  postal_code = '01426-001',
  latitude = -23.5662,
  longitude = -46.6722
WHERE nome = 'Pizza Express';