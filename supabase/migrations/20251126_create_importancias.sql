-- =====================================================
-- Migration: Criar tabela de importâncias e relação M:N
-- Data: 26 Nov 2025
-- =====================================================

-- Tabela de importâncias (estrutura igual a temas)
CREATE TABLE IF NOT EXISTS public.importancias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  cor VARCHAR(50) NOT NULL DEFAULT 'gray',
  icone VARCHAR(50),
  ativo BOOLEAN DEFAULT true,
  ordem INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_importancias_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger de updated_at
CREATE TRIGGER trigger_importancias_updated_at
  BEFORE UPDATE ON importancias
  FOR EACH ROW
  EXECUTE FUNCTION update_importancias_updated_at();

-- Índices
CREATE INDEX idx_importancias_ativo ON importancias(ativo);
CREATE INDEX idx_importancias_ordem ON importancias(ordem);

-- Tabela M:N announcement_importancias (igual announcement_temas)
CREATE TABLE IF NOT EXISTS public.announcement_importancias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  importancia_id UUID NOT NULL REFERENCES public.importancias(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(announcement_id, importancia_id)
);

CREATE INDEX idx_announcement_importancias_announcement ON announcement_importancias(announcement_id);
CREATE INDEX idx_announcement_importancias_importancia ON announcement_importancias(importancia_id);

-- Dados iniciais
INSERT INTO importancias (slug, nome, descricao, cor, ordem) VALUES
  ('normal', 'Normal', 'Prioridade padrão', 'gray', 1),
  ('urgent', 'Urgente', 'Aparece em destaque com badge vermelho', 'red', 0);
