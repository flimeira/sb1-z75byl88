-- Tabela de configuração de pontos
CREATE TABLE points_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    points_expiration_days INTEGER NOT NULL DEFAULT 365,
    points_per_order DECIMAL(10,2) NOT NULL DEFAULT 10.00,
    points_per_review DECIMAL(10,2) NOT NULL DEFAULT 5.00,
    points_per_referral DECIMAL(10,2) NOT NULL DEFAULT 20.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabela de pontos do usuário
CREATE TABLE user_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    total_points DECIMAL(10,2) NOT NULL DEFAULT 0,
    points_expiration_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id)
);

-- Tabela de histórico de pontos
CREATE TABLE points_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    points DECIMAL(10,2) NOT NULL,
    action_type TEXT NOT NULL, -- 'order', 'review', 'referral', 'expiration'
    reference_id UUID, -- ID do pedido, avaliação ou referência
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_points_config_updated_at
    BEFORE UPDATE ON points_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_points_updated_at
    BEFORE UPDATE ON user_points
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Inserir configuração inicial
INSERT INTO points_config (points_expiration_days, points_per_order, points_per_review, points_per_referral)
VALUES (365, 10.00, 5.00, 20.00);

-- Função para adicionar pontos
CREATE OR REPLACE FUNCTION add_user_points(
    p_user_id UUID,
    p_points DECIMAL,
    p_action_type TEXT,
    p_reference_id UUID,
    p_description TEXT
) RETURNS void AS $$
DECLARE
    v_config points_config%ROWTYPE;
    v_expiration_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Buscar configuração
    SELECT * INTO v_config FROM points_config ORDER BY created_at DESC LIMIT 1;
    
    -- Calcular data de expiração
    v_expiration_date := TIMEZONE('utc'::text, NOW()) + (v_config.points_expiration_days || ' days')::INTERVAL;
    
    -- Inserir ou atualizar pontos do usuário
    INSERT INTO user_points (user_id, total_points, points_expiration_date)
    VALUES (p_user_id, p_points, v_expiration_date)
    ON CONFLICT (user_id) DO UPDATE
    SET total_points = user_points.total_points + p_points,
        points_expiration_date = v_expiration_date;
    
    -- Registrar histórico
    INSERT INTO points_history (user_id, points, action_type, reference_id, description)
    VALUES (p_user_id, p_points, p_action_type, p_reference_id, p_description);
END;
$$ LANGUAGE plpgsql; 