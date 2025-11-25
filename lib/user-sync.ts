import { getStreamChatClient } from './stream-chat';
import { supabaseAdmin, Database } from './supabase';

type User = Database['public']['Tables']['users']['Row'];
type UserPermission = Database['public']['Tables']['user_permissions']['Row'];

/**
 * Sincroniza usuário do Supabase com Stream Chat
 * Cria ou atualiza o usuário no Stream
 *
 * @param userId - ID do usuário no Supabase
 * @param userData - Dados do usuário (opcional). Se passado, evita SELECT e usa esses dados.
 *                   Útil quando chamado logo após um UPDATE para evitar race condition.
 */
export async function syncUserToStream(
  userId: string,
  userData?: Partial<User>
): Promise<{ success: boolean; error?: string }> {
  try {
    let user: User | null = null;

    // Se userData foi passado, usar esses dados (evita race condition após UPDATE)
    if (userData && userData.id && userData.nome && userData.email) {
      user = userData as User;
    } else {
      // Caso contrário, buscar do Supabase
      const { data, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError || !data) {
        return { success: false, error: 'Usuário não encontrado no Supabase' };
      }
      user = data;
    }

    if (!user) {
      return { success: false, error: 'Usuário não encontrado' };
    }

    // 2. Buscar permissões do usuário
    const { data: permissions } = await supabaseAdmin
      .from('user_permissions')
      .select('*')
      .eq('user_id', userId);

    const temasPermitidos = permissions?.map(p => p.tema) || [];

    // 3. Criar/atualizar usuário no Stream Chat
    const streamClient = getStreamChatClient();

    const streamUserId = user.stream_user_id || user.id;

    await streamClient.upsertUser({
      id: streamUserId,
      name: user.nome,
      image: user.avatar || undefined,
      role: user.role as 'admin' | 'user',
      custom: {
        email: user.email,
        supabase_id: user.id,
        temas_permitidos: temasPermitidos,
        status: user.status
      }
    });

    // 4. Atualizar stream_user_id no Supabase se não existia
    if (!user.stream_user_id) {
      await supabaseAdmin
        .from('users')
        .update({ stream_user_id: streamUserId })
        .eq('id', userId);
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao sincronizar usuário:', error);
    return { success: false, error: 'Erro ao sincronizar com Stream Chat' };
  }
}

/**
 * Remove usuário do Stream Chat
 */
export async function deleteUserFromStream(streamUserId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const streamClient = getStreamChatClient();

    // Deletar permanentemente
    await streamClient.deleteUser(streamUserId, {
      mark_messages_deleted: true, // Marca mensagens como deletadas
      hard_delete: true // Remove completamente
    });

    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar usuário do Stream:', error);
    return { success: false, error: 'Erro ao deletar do Stream Chat' };
  }
}

/**
 * Atualiza membros dos canais baseado nas permissões do usuário
 * Remove de canais que perdeu acesso e adiciona aos que ganhou
 */
export async function updateUserChannelMemberships(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Buscar usuário e permissões
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('stream_user_id')
      .eq('id', userId)
      .single();

    if (!user?.stream_user_id) {
      return { success: false, error: 'Stream user ID não encontrado' };
    }

    const { data: permissions } = await supabaseAdmin
      .from('user_permissions')
      .select('*')
      .eq('user_id', userId);

    const temasPermitidos = permissions
      ?.filter(p => p.can_view_chat)
      .map(p => p.tema) || [];

    // 2. Buscar todos os canais do Stream
    const streamClient = getStreamChatClient();
    const channels = await streamClient.queryChannels({
      type: 'messaging'
    });

    // 3. Para cada canal, verificar se usuário deve ser membro
    for (const channel of channels) {
      const channelTema = channel.data?.tema as string;
      const isMember = channel.state.members[user.stream_user_id] !== undefined;
      const shouldBeMember = temasPermitidos.includes(channelTema);

      if (shouldBeMember && !isMember) {
        // Adicionar usuário ao canal
        await channel.addMembers([user.stream_user_id]);
      } else if (!shouldBeMember && isMember) {
        // Remover usuário do canal
        await channel.removeMembers([user.stream_user_id]);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar memberships:', error);
    return { success: false, error: 'Erro ao atualizar canais' };
  }
}

/**
 * Sincroniza todos os usuários do Supabase com Stream Chat
 * Útil para migração inicial ou resync completo
 */
export async function syncAllUsers(): Promise<{
  total: number;
  success: number;
  failed: number;
  errors: string[]
}> {
  const result = {
    total: 0,
    success: 0,
    failed: 0,
    errors: [] as string[]
  };

  try {
    // Buscar todos usuários ativos
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, nome, status')
      .eq('status', 'active');

    if (error || !users) {
      result.errors.push('Erro ao buscar usuários do Supabase');
      return result;
    }

    result.total = users.length;

    // Sincronizar cada usuário
    for (const user of users) {
      const syncResult = await syncUserToStream(user.id);

      if (syncResult.success) {
        result.success++;
      } else {
        result.failed++;
        result.errors.push(`${user.nome}: ${syncResult.error}`);
      }
    }

    return result;
  } catch (error) {
    console.error('Erro ao sincronizar todos usuários:', error);
    result.errors.push('Erro geral na sincronização');
    return result;
  }
}

/**
 * Busca canais permitidos para um usuário baseado em suas permissões
 */
export async function getUserAllowedChannels(userId: string): Promise<{
  channels: any[];
  error?: string;
}> {
  try {
    // 1. Buscar permissões
    const { data: permissions } = await supabaseAdmin
      .from('user_permissions')
      .select('tema')
      .eq('user_id', userId)
      .eq('can_view_chat', true);

    const temasPermitidos = permissions?.map(p => p.tema) || [];

    if (temasPermitidos.length === 0) {
      return { channels: [] };
    }

    // 2. Buscar canais do Stream filtrados por tema
    const streamClient = getStreamChatClient();
    const channels = await streamClient.queryChannels({
      type: 'messaging',
      'data.tema': { $in: temasPermitidos }
    });

    return { channels };
  } catch (error) {
    console.error('Erro ao buscar canais permitidos:', error);
    return { channels: [], error: 'Erro ao buscar canais' };
  }
}

/**
 * Cria log de auditoria para ações importantes
 */
export async function createAuditLog(
  userId: string | null,
  action: string,
  module: string,
  details: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    await supabaseAdmin.from('audit_logs').insert({
      user_id: userId,
      action,
      module,
      details,
      ip_address: ipAddress || null,
      user_agent: userAgent || null
    });
  } catch (error) {
    console.error('Erro ao criar audit log:', error);
    // Não falha a operação principal se log falhar
  }
}
