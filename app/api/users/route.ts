import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { syncUserToStream, createAuditLog } from '@/lib/user-sync';

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
 * Cria novo usuário no Supabase e sincroniza com Stream Chat
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, nome, avatar, role = 'user', temas = [] } = body;

    // Validações básicas
    if (!email || !nome) {
      return NextResponse.json(
        { error: 'Email e nome são obrigatórios' },
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

    // 1. Criar usuário no Supabase
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
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

    // 2. Criar permissões para cada tema
    if (temas.length > 0) {
      const permissions = temas.map((tema: string) => ({
        user_id: user.id,
        tema,
        can_view_chat: true,
        can_send_messages: true,
        can_view_announcements: true,
        can_create_announcements: false,
        can_moderate: false,
        can_delete_messages: false
      }));

      const { error: permError } = await supabaseAdmin
        .from('user_permissions')
        .insert(permissions);

      if (permError) {
        console.error('Erro ao criar permissões:', permError);
        // Continua mesmo se falhar (permissões podem ser adicionadas depois)
      }
    }

    // 3. Sincronizar com Stream Chat
    const syncResult = await syncUserToStream(user.id);

    if (!syncResult.success) {
      console.error('Erro ao sincronizar com Stream:', syncResult.error);
      // Não falha a criação, mas avisa
    }

    // 4. Criar audit log
    await createAuditLog(
      null, // TODO: pegar userId do admin quando implementar auth
      'create_user',
      'users',
      { user_id: user.id, email, nome, temas }
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
