-- Migration: Criar tabela channel_temas
-- Relacionamento M:N entre canais (Stream Chat) e temas (Supabase)

-- Tabela junction: channel_temas
-- stream_channel_id é o ID do canal no Stream Chat (formato: "type:id", ex: "messaging:abc123")
CREATE TABLE IF NOT EXISTS public.channel_temas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_channel_id VARCHAR(255) NOT NULL,
  tema_id UUID NOT NULL REFERENCES public.temas(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(stream_channel_id, tema_id)
);

-- Índices para queries eficientes
CREATE INDEX IF NOT EXISTS idx_channel_temas_channel ON channel_temas(stream_channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_temas_tema ON channel_temas(tema_id);

-- Comentários
COMMENT ON TABLE channel_temas IS 'Relacionamento M:N entre canais Stream Chat e temas';
COMMENT ON COLUMN channel_temas.stream_channel_id IS 'ID do canal no Stream Chat (formato: type:id)';
COMMENT ON COLUMN channel_temas.tema_id IS 'FK para tabela temas';
