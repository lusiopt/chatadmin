-- Habilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para service role (admin tem acesso total)
CREATE POLICY "Service role has full access to users" ON public.users
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to permissions" ON public.user_permissions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to audit" ON public.audit_logs
    FOR ALL USING (auth.role() = 'service_role');

-- Políticas públicas para leitura (anon key pode ver usuários ativos)
CREATE POLICY "Public can view active users" ON public.users
    FOR SELECT USING (status = 'active');

-- Função para criar usuário com permissões
CREATE OR REPLACE FUNCTION public.create_user_with_permissions(
    p_email TEXT,
    p_nome TEXT,
    p_temas TEXT[],
    p_role TEXT DEFAULT 'user'
)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_tema TEXT;
BEGIN
    INSERT INTO public.users (email, nome, role)
    VALUES (p_email, p_nome, p_role)
    RETURNING id INTO v_user_id;
    
    FOREACH v_tema IN ARRAY p_temas
    LOOP
        INSERT INTO public.user_permissions (user_id, tema)
        VALUES (v_user_id, v_tema);
    END LOOP;
    
    RETURN json_build_object(
        'user_id', v_user_id,
        'email', p_email,
        'nome', p_nome,
        'temas', p_temas
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_users_timestamp
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_permissions_timestamp
    BEFORE UPDATE ON public.user_permissions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();
