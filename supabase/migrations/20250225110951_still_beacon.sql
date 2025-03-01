/*
  # Ajustes na validação de pedidos

  1. Alterações
    - Adiciona restrições de validação para valores monetários
    - Cria função para validar o total do pedido
    - Adiciona trigger para validação automática

  2. Validações
    - Garante que total_amount e delivery_fee são não negativos
    - Valida a consistência entre total do pedido e itens
*/

-- Adiciona restrições de validação para valores monetários
ALTER TABLE orders
  ADD CONSTRAINT check_total_amount_positive CHECK (total_amount >= 0),
  ADD CONSTRAINT check_delivery_fee_non_negative CHECK (delivery_fee >= 0);

-- Função para validar o total do pedido
CREATE OR REPLACE FUNCTION validate_order_total()
RETURNS TRIGGER AS $$
DECLARE
  calculated_total NUMERIC;
BEGIN
  -- Calcula o total baseado nos itens do pedido
  SELECT COALESCE(SUM(quantity * unit_price), 0)
  INTO calculated_total
  FROM order_items
  WHERE order_id = NEW.id;

  -- Verifica se o total calculado corresponde ao total informado
  IF NEW.total_amount != calculated_total THEN
    RAISE EXCEPTION 'Total amount (%) does not match sum of order items (%)', 
      NEW.total_amount, calculated_total;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar o total do pedido após a inserção dos itens
CREATE TRIGGER validate_order_total_trigger
  AFTER INSERT ON order_items
  FOR EACH STATEMENT
  EXECUTE FUNCTION validate_order_total();