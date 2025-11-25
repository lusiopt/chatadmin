-- Migration: create_announcements_table.sql
-- Criado em: 25 Nov 2025
-- Descrição: Tabela de avisos com suporte a múltiplos temas

-- Tabela principal de avisos
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    image_url TEXT,
    link_url TEXT,
    link_text VARCHAR(100),
    stream_activity_id VARCHAR(255),      -- ID da activity no Stream Feeds (para sync)
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de relacionamento aviso↔temas (M:N)
CREATE TABLE IF NOT EXISTS public.announcement_temas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
    tema_id UUID NOT NULL REFERENCES temas(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(announcement_id, tema_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_announcements_status ON announcements(status);
CREATE INDEX IF NOT EXISTS idx_announcements_created ON announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcement_temas_announcement ON announcement_temas(announcement_id);
CREATE INDEX IF NOT EXISTS idx_announcement_temas_tema ON announcement_temas(tema_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_announcements_updated_at ON announcements;
CREATE TRIGGER trigger_announcements_updated_at
    BEFORE UPDATE ON announcements
    FOR EACH ROW
    EXECUTE FUNCTION update_announcements_updated_at();

-- Comentários
COMMENT ON TABLE announcements IS 'Avisos/anúncios para o feed de atividades';
COMMENT ON TABLE announcement_temas IS 'Relacionamento M:N entre avisos e temas';
COMMENT ON COLUMN announcements.stream_activity_id IS 'ID da activity no Stream Feeds para sincronização';
COMMENT ON COLUMN announcements.status IS 'draft = rascunho, published = publicado no Stream Feeds';
