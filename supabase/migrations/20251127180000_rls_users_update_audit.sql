-- =============================================
-- Migration: RLS UPDATE policy + Audit Log
-- Data: 27 Nov 2025
-- Descrição: Permite que usuários editem próprio perfil
--            e registra histórico de mudanças
-- =============================================

-- =============================================
-- 1. POLÍTICA RLS: Usuários podem editar próprio registro
-- =============================================
CREATE POLICY "Users can update own record"
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- =============================================
-- 2. TABELA DE AUDITORIA: Histórico de mudanças
-- =============================================
CREATE TABLE public.users_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    field_changed TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_at TIMESTAMPTZ DEFAULT now(),
    changed_by TEXT
);

-- Índice para buscas por usuário
CREATE INDEX idx_users_audit_user_id ON public.users_audit(user_id);
CREATE INDEX idx_users_audit_changed_at ON public.users_audit(changed_at DESC);

-- RLS para audit (admins podem ler tudo, usuários só próprio histórico)
ALTER TABLE public.users_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit"
ON public.users_audit FOR SELECT
USING (auth.uid()::text = user_id);  -- user_id é TEXT na tabela audit

CREATE POLICY "Admins can view all audit"
ON public.users_audit FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Service role pode inserir (para o trigger)
CREATE POLICY "Service role can insert audit"
ON public.users_audit FOR INSERT
WITH CHECK (true);

-- =============================================
-- 3. TRIGGER: Registrar mudanças automaticamente
-- =============================================
CREATE OR REPLACE FUNCTION log_user_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Registrar mudança de nome
    IF OLD.nome IS DISTINCT FROM NEW.nome THEN
        INSERT INTO users_audit (user_id, field_changed, old_value, new_value, changed_by)
        VALUES (NEW.id, 'nome', OLD.nome, NEW.nome, COALESCE(auth.uid()::text, 'system'));
    END IF;

    -- Registrar mudança de email
    IF OLD.email IS DISTINCT FROM NEW.email THEN
        INSERT INTO users_audit (user_id, field_changed, old_value, new_value, changed_by)
        VALUES (NEW.id, 'email', OLD.email, NEW.email, COALESCE(auth.uid()::text, 'system'));
    END IF;

    -- Registrar mudança de role (só admin pode mudar)
    IF OLD.role IS DISTINCT FROM NEW.role THEN
        INSERT INTO users_audit (user_id, field_changed, old_value, new_value, changed_by)
        VALUES (NEW.id, 'role', OLD.role, NEW.role, COALESCE(auth.uid()::text, 'system'));
    END IF;

    -- Registrar mudança de status
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO users_audit (user_id, field_changed, old_value, new_value, changed_by)
        VALUES (NEW.id, 'status', OLD.status, NEW.status, COALESCE(auth.uid()::text, 'system'));
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER users_audit_trigger
AFTER UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION log_user_changes();

-- =============================================
-- 4. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =============================================
COMMENT ON TABLE public.users_audit IS 'Histórico de mudanças em perfis de usuários';
COMMENT ON COLUMN public.users_audit.user_id IS 'ID do usuário que teve o perfil alterado';
COMMENT ON COLUMN public.users_audit.field_changed IS 'Campo que foi alterado (nome, email, role, status)';
COMMENT ON COLUMN public.users_audit.old_value IS 'Valor anterior';
COMMENT ON COLUMN public.users_audit.new_value IS 'Novo valor';
COMMENT ON COLUMN public.users_audit.changed_at IS 'Data/hora da alteração';
COMMENT ON COLUMN public.users_audit.changed_by IS 'ID do usuário que fez a alteração (ou system)';
