-- Migration: Criar tabela de temas dinamicos
-- Criado em: 25 Nov 2025
-- Objetivo: Permitir adicionar/editar/remover temas sem alterar codigo

-- Tabela principal de temas
CREATE TABLE IF NOT EXISTS public.temas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(50) UNIQUE NOT NULL,        -- 'cartoes', 'milhas', 'network'
    nome VARCHAR(100) NOT NULL,              -- 'Cartoes', 'Milhas', 'Network'
    descricao TEXT,
    cor VARCHAR(50) DEFAULT 'gray',          -- Para badges na UI (blue, green, purple, etc)
    icone VARCHAR(50),                       -- Nome do icone do lucide-react (opcional)
    ativo BOOLEAN DEFAULT true,
    ordem INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dados iniciais (os 3 temas existentes)
INSERT INTO temas (slug, nome, descricao, cor, ordem) VALUES
  ('cartoes', 'Cartoes', 'Cartoes de credito e beneficios', 'blue', 1),
  ('milhas', 'Milhas', 'Programa de milhas e pontos', 'green', 2),
  ('network', 'Network', 'Networking e comunidade', 'purple', 3);

-- Indices para performance
CREATE INDEX idx_temas_ativo ON temas(ativo);
CREATE INDEX idx_temas_ordem ON temas(ordem);
CREATE INDEX idx_temas_slug ON temas(slug);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_temas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_temas_updated_at
    BEFORE UPDATE ON temas
    FOR EACH ROW
    EXECUTE FUNCTION update_temas_updated_at();

-- RLS (Row Level Security) - por enquanto desabilitado para admin
-- ALTER TABLE temas ENABLE ROW LEVEL SECURITY;

-- Comentarios na tabela
COMMENT ON TABLE temas IS 'Tabela de temas dinamicos para segmentacao de avisos e permissoes';
COMMENT ON COLUMN temas.slug IS 'Identificador unico do tema (usado em URLs e feeds)';
COMMENT ON COLUMN temas.nome IS 'Nome de exibicao do tema';
COMMENT ON COLUMN temas.cor IS 'Cor para badges na UI (blue, green, purple, gray, red, yellow, etc)';
COMMENT ON COLUMN temas.icone IS 'Nome do icone do lucide-react (CreditCard, Plane, Users, etc)';
COMMENT ON COLUMN temas.ativo IS 'Se false, tema nao aparece em selecoes (soft delete)';
COMMENT ON COLUMN temas.ordem IS 'Ordem de exibicao na UI';
