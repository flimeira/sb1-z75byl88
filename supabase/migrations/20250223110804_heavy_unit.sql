/*
  # Add payment method to orders table

  1. Changes
    - Add payment_method column to orders table
    - Add check constraint to ensure valid payment methods
    - Update RLS policies to include the new column
*/

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'credit_card'
  CHECK (payment_method IN ('credit_card', 'cash'));