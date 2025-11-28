import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { syncUserToStream, updateUserChannelMemberships, createAuditLog } from '@/lib/user-sync';

/**
 * GET /api/users
 * Lista todos os usuários com paginação
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status'); // active, inactive
    const search = searchParams.get('search'); // busca por nome ou email

    const offset = (page - 1) * limit;

    // Construir query
    let query = supabaseAdmin
      .from('users')
      .select('*, user_permissions(*)', { count: 'exact' });

    // Filtros opcionais
    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`nome.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Paginação e ordenação
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: users, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar usuários:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar usuários' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      users: users || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Erro na API de usuários:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users
 * Cria novo usuário no Supabase Auth + public.users e sincroniza com Stream Chat
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, nome, avatar, role = 'user', password, permissions = [] } = body;

    // Validações básicas
    if (!email || !nome) {
      return NextResponse.json(
        { error: 'Email e nome são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar senha (obrigatória para criar)
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Senha é obrigatória (mínimo 6 caracteres)' },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    // 1. Criar em auth.users PRIMEIRO (credenciais de login)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirmar email automaticamente
    });

    if (authError) {
      console.error('Erro ao criar em auth.users:', authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    const authUserId = authData.user.id;

    // 2. Criar em public.users com o MESMO ID do auth.users
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUserId, // ← Usar ID do auth.users
        email,
        nome,
        avatar,
        role,
        status: 'active'
      })
      .select()
      .single();

    if (userError) {
      console.error('Erro ao criar usuário:', userError);

      // Email duplicado
      if (userError.code === '23505') {
        return NextResponse.json(
          { error: 'Email já cadastrado' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: 'Erro ao criar usuário' },
        { status: 500 }
      );
    }

    // 2. Criar permissões granulares para cada tema
    if (permissions.length > 0) {
      const permissionsToInsert = permissions.map((p: any) => ({
        user_id: user.id,
        tema: p.tema,
        can_view_chat: p.can_view_chat ?? true,
        can_send_messages: p.can_send_messages ?? true,
        can_view_announcements: p.can_view_announcements ?? true,
        can_create_announcements: p.can_create_announcements ?? false,
        can_moderate: p.can_moderate ?? false,
        can_delete_messages: p.can_delete_messages ?? false
      }));

      const { error: permError } = await supabaseAdmin
        .from('user_permissions')
        .insert(permissionsToInsert);

      if (permError) {
        console.error('Erro ao criar permissões:', permError);
      }
    }

    // 3. Sincronizar com Stream Chat
    const syncResult = await syncUserToStream(user.id);

    if (!syncResult.success) {
      console.error('Erro ao sincronizar com Stream:', syncResult.error);
    }

    // 4. Sincronizar memberships dos canais
    const membershipResult = await updateUserChannelMemberships(user.id);

    if (!membershipResult.success) {
      console.error('Erro ao sincronizar canais:', membershipResult.error);
    }

    // 5. Criar audit log
    await createAuditLog(
      null,
      'create_user',
      'users',
      { user_id: user.id, email, nome, permissions }
    );

    return NextResponse.json({
      user,
      stream_synced: syncResult.success,
      message: 'Usuário criado com sucesso'
    }, { status: 201 });

  } catch (error) {
    console.error('Erro na criação de usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
