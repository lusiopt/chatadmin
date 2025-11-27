-- Migration: Adaptar tabela user_permissions para usar tema_id
-- A tabela já existe com 'tema' (string), vamos adicionar 'tema_id' (UUID)

-- 1. Adicionar coluna tema_id (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_permissions' AND column_name = 'tema_id'
  ) THEN
    ALTER TABLE user_permissions ADD COLUMN tema_id UUID REFERENCES temas(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 2. Migrar dados: converter tema (string) para tema_id (UUID)
UPDATE user_permissions up
SET tema_id = t.id
FROM temas t
WHERE LOWER(up.tema) = LOWER(t.nome)
  AND up.tema_id IS NULL;

-- 3. Criar índice para queries rápidas
CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_tema ON user_permissions(tema_id);

-- 4. Criar view para canais permitidos por usuário
CREATE OR REPLACE VIEW user_allowed_channels AS
SELECT DISTINCT
  up.user_id,
  ct.stream_channel_id,
  t.slug as tema_slug,
  t.nome as tema_nome
FROM user_permissions up
JOIN temas t ON t.id = up.tema_id
JOIN channel_temas ct ON ct.tema_id = t.id
WHERE up.tema_id IS NOT NULL;

-- 5. Criar view para temas permitidos por usuário
CREATE OR REPLACE VIEW user_allowed_temas AS
SELECT DISTINCT
  up.user_id,
  t.id as tema_id,
  t.slug,
  t.nome,
  t.cor
FROM user_permissions up
JOIN temas t ON t.id = up.tema_id
WHERE up.tema_id IS NOT NULL;

-- 6. Comentários
COMMENT ON TABLE user_permissions IS 'Permissões de usuários por tema - fonte única de verdade';
COMMENT ON VIEW user_allowed_channels IS 'Canais que cada usuário pode acessar baseado nos temas permitidos';
COMMENT ON VIEW user_allowed_temas IS 'Temas que cada usuário tem permissão para acessar';
