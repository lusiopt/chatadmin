import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { syncUserToStream, updateUserChannelMemberships, deleteUserFromStream, createAuditLog } from '@/lib/user-sync';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/users/[id]
 * Busca um usuário específico com suas permissões
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*, user_permissions(*)')
      .eq('id', id)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/users/[id]
 * Atualiza dados de um usuário (incluindo auth.users) e sincroniza com Stream Chat
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { nome, avatar, role, status, email, newPassword, permissions } = body;

    // Validações
    if (nome && nome.trim().length === 0) {
      return NextResponse.json(
        { error: 'Nome não pode ser vazio' },
        { status: 400 }
      );
    }

    // Buscar usuário atual para comparar email
    const { data: currentUser } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('id', id)
      .single();

    // 1. Atualizar auth.users se email ou senha mudaram
    const authUpdates: any = {};
    if (email && currentUser && email !== currentUser.email) {
      authUpdates.email = email;
    }
    if (newPassword && newPassword.length >= 6) {
      authUpdates.password = newPassword;
    }

    if (Object.keys(authUpdates).length > 0) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, authUpdates);
      if (authError) {
        console.error('Erro ao atualizar auth.users:', authError);
        return NextResponse.json(
          { error: 'Erro ao atualizar credenciais: ' + authError.message },
          { status: 400 }
        );
      }
    }

    // 2. Atualizar dados básicos do usuário em public.users
    const updateData: any = {};
    if (nome !== undefined) updateData.nome = nome;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (role !== undefined) updateData.role = role;
    if (status !== undefined) updateData.status = status;
    if (email !== undefined) updateData.email = email;

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (userError || !user) {
      console.error('Erro ao atualizar usuário:', userError);
      return NextResponse.json(
        { error: 'Erro ao atualizar usuário' },
        { status: 500 }
      );
    }

    // 2. Atualizar permissões granulares (se fornecido)
    if (permissions && Array.isArray(permissions)) {
      // Deletar permissões antigas
      await supabaseAdmin
        .from('user_permissions')
        .delete()
        .eq('user_id', id);

      // Criar novas permissões com valores granulares
      if (permissions.length > 0) {
        const permissionsToInsert = permissions.map((p: any) => ({
          user_id: id,
          tema: p.tema,
          can_view_chat: p.can_view_chat ?? true,
          can_send_messages: p.can_send_messages ?? true,
          can_view_announcements: p.can_view_announcements ?? true,
          can_create_announcements: p.can_create_announcements ?? false,
          can_moderate: p.can_moderate ?? false,
          can_delete_messages: p.can_delete_messages ?? false
        }));

        await supabaseAdmin
          .from('user_permissions')
          .insert(permissionsToInsert);
      }
    }

    // 3. Sincronizar com Stream Chat (passando dados atualizados para evitar race condition)
    const syncResult = await syncUserToStream(id, user);

    if (!syncResult.success) {
      console.error('Erro ao sincronizar com Stream:', syncResult.error);
    }

    // 4. Sincronizar memberships dos canais (especialmente importante após mudar permissões)
    const membershipResult = await updateUserChannelMemberships(id);

    if (!membershipResult.success) {
      console.error('Erro ao sincronizar canais:', membershipResult.error);
    }

    // 5. Criar audit log
    await createAuditLog(
      null,
      'update_user',
      'users',
      { user_id: id, changes: updateData, permissions }
    );

    return NextResponse.json({
      user,
      stream_synced: syncResult.success,
      channels_synced: membershipResult.success,
      message: 'Usuário atualizado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/[id]
 * Deleta um usuário do Supabase (auth + public) e do Stream Chat
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    // 1. Buscar stream_user_id antes de deletar
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('stream_user_id, nome, email')
      .eq('id', id)
      .single();

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // 2. Deletar de public.users (cascade deletará permissões também)
    const { error: deleteError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Erro ao deletar usuário:', deleteError);
      return NextResponse.json(
        { error: 'Erro ao deletar usuário' },
        { status: 500 }
      );
    }

    // 3. Deletar de auth.users (credenciais de login)
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (authDeleteError) {
      console.error('Erro ao deletar de auth.users:', authDeleteError);
      // Não falha - public.users já foi deletado
    }

    // 4. Deletar do Stream Chat
    if (user.stream_user_id) {
      const streamResult = await deleteUserFromStream(user.stream_user_id);

      if (!streamResult.success) {
        console.error('Erro ao deletar do Stream:', streamResult.error);
        // Continua mesmo se falhar no Stream
      }
    }

    // 5. Criar audit log
    await createAuditLog(
      null,
      'delete_user',
      'users',
      { user_id: id, nome: user.nome, email: user.email }
    );

    return NextResponse.json({
      message: 'Usuário deletado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
