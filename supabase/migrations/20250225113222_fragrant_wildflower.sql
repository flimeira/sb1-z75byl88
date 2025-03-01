/*
  # Correção do campo deliveryFee

  1. Alterações
    - Altera o tipo do campo deliveryFee para numeric
    - Adiciona constraint para garantir valores não negativos
    - Atualiza os valores existentes:
      - 'Free' -> 0
      - Valores com prefixo '$' são convertidos para número

  2. Segurança
    - Mantém as políticas RLS existentes
*/

-- Primeiro, cria uma coluna temporária
ALTER TABLE restaurants 
ADD COLUMN delivery_fee_new numeric;

-- Atualiza os valores da nova coluna usando CASE com texto
DO $$
BEGIN
  UPDATE restaurants 
  SET delivery_fee_new = (
    CASE 
      WHEN deliveryFee::text = 'Free' THEN 0
      ELSE NULLIF(regexp_replace(deliveryFee::text, '[^0-9.]', '', 'g'), '')::numeric
    END
  );
END $$;

-- Remove a coluna antiga
ALTER TABLE restaurants 
DROP COLUMN deliveryFee;

-- Renomeia a nova coluna
ALTER TABLE restaurants 
RENAME COLUMN delivery_fee_new TO deliveryFee;

-- Adiciona a constraint NOT NULL e CHECK
ALTER TABLE restaurants 
ALTER COLUMN deliveryFee SET NOT NULL,
ADD CONSTRAINT check_delivery_fee_non_negative CHECK (deliveryFee >= 0);

-- Atualiza os valores nulos para 0
UPDATE restaurants 
SET deliveryFee = 0 
WHERE deliveryFee IS NULL;