import { StreamChat, Channel, ChannelSort, ChannelFilters } from 'stream-chat';
import { Readable } from 'stream';

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY!;
const secret = process.env.STREAM_SECRET!;

// Singleton instance
let chatClient: StreamChat | null = null;

export interface ChannelData {
  id: string;
  type: string;
  name?: string;
  image?: string;
  member_count?: number;
  created_at?: string;
  updated_at?: string;
  created_by?: {
    id: string;
    name?: string;
  };
}

export interface CreateChannelParams {
  type: string;
  id: string;
  name?: string;
  image?: string;
  members?: string[];
  data?: Record<string, any>;
}

export interface UpdateChannelParams {
  name?: string;
  image?: string;
  data?: Record<string, any>;
}

/**
 * Inicializa o cliente Stream Chat como admin
 * Para operações server-side, usamos o secret diretamente
 */
export function getStreamChatClient(): StreamChat {
  if (!chatClient) {
    // Para operações server-side, passamos o secret como segundo parâmetro
    // Isso permite fazer operações administrativas sem precisar conectar um usuário
    if (typeof window === 'undefined' && secret) {
      chatClient = StreamChat.getInstance(apiKey, secret);
    } else {
      chatClient = StreamChat.getInstance(apiKey);
    }
  }

  return chatClient;
}

/**
 * Lista todos os canais
 */
export async function listChannels(
  filters: ChannelFilters = {},
  sort: ChannelSort = { created_at: -1 },
  options = { limit: 30 }
): Promise<ChannelData[]> {
  const client = getStreamChatClient();

  const channels = await client.queryChannels(filters, sort, options);

  return channels.map(channel => ({
    id: channel.id || '',
    type: channel.type,
    name: channel.data?.name as string | undefined,
    image: channel.data?.image as string | undefined,
    member_count: channel.data?.member_count as number | undefined,
    created_at: channel.data?.created_at as string | undefined,
    updated_at: channel.data?.updated_at as string | undefined,
    created_by: channel.data?.created_by as { id: string; name?: string } | undefined,
  }));
}

/**
 * Obtém detalhes de um canal específico
 */
export async function getChannel(
  type: string,
  id: string
): Promise<Channel | null> {
  try {
    const client = getStreamChatClient();
    const channel = client.channel(type, id);
    await channel.watch();
    return channel;
  } catch (error) {
    console.error('Erro ao buscar canal:', error);
    return null;
  }
}

/**
 * Cria um novo canal
 */
export async function createChannel(
  params: CreateChannelParams
): Promise<Channel> {
  const client = getStreamChatClient();

  const channel = client.channel(params.type, params.id, {
    name: params.name,
    image: params.image,
    members: params.members,
    created_by_id: 'admin', // Necessário quando usando autenticação server-side
    ...params.data,
  });

  await channel.create();

  return channel;
}

/**
 * Atualiza um canal existente
 */
export async function updateChannel(
  type: string,
  id: string,
  params: UpdateChannelParams
): Promise<Channel> {
  const client = getStreamChatClient();
  const channel = client.channel(type, id);

  await channel.update({
    name: params.name,
    image: params.image,
    ...params.data,
  });

  return channel;
}

/**
 * Deleta um canal
 */
export async function deleteChannel(
  type: string,
  id: string
): Promise<void> {
  const client = getStreamChatClient();
  const channel = client.channel(type, id);

  await channel.delete();
}

/**
 * Adiciona membros a um canal
 */
export async function addMembers(
  type: string,
  id: string,
  userIds: string[]
): Promise<void> {
  const client = getStreamChatClient();
  const channel = client.channel(type, id);

  await channel.addMembers(userIds);
}

/**
 * Remove membros de um canal
 */
export async function removeMembers(
  type: string,
  id: string,
  userIds: string[]
): Promise<void> {
  const client = getStreamChatClient();
  const channel = client.channel(type, id);

  await channel.removeMembers(userIds);
}

/**
 * Lista membros de um canal
 */
export async function listMembers(
  type: string,
  id: string
): Promise<any[]> {
  const client = getStreamChatClient();
  const channel = client.channel(type, id);

  await channel.watch();

  const members = Object.values(channel.state.members);

  return members.map(member => ({
    user_id: member.user_id,
    user: member.user,
    role: member.role,
    created_at: member.created_at,
  }));
}

/**
 * Lista todos os usuários do Stream Chat
 */
export async function listUsers(
  filters: Record<string, any> = {},
  sort = [{ created_at: -1 }],
  options = { limit: 100 }
): Promise<any[]> {
  const client = getStreamChatClient();

  const response = await client.queryUsers(filters, sort as any, options);

  return response.users.map(user => ({
    id: user.id,
    name: user.name || user.id,
    image: user.image,
    role: user.role,
    created_at: user.created_at,
    updated_at: user.updated_at,
  }));
}

/**
 * Faz upload de imagem para o Stream CDN usando o SDK
 * Retorna a URL da imagem hospedada
 *
 * @param userId - ID do usuário que está fazendo o upload. Default: 'admin'
 *                 TODO: Substituir por userId real quando implementar autenticação
 */
export async function uploadChannelImage(
  file: Buffer,
  fileName: string,
  contentType: string,
  userId: string = 'admin'
): Promise<string> {
  try {
    const client = getStreamChatClient();

    // Criar canal temporário para o upload
    const tempChannel = client.channel('messaging', `temp-upload-${Date.now()}`);
    await tempChannel.create();

    // Converter Buffer para Readable Stream (Node.js)
    const readable = Readable.from(file);

    // Fazer upload da imagem com userId
    // O parâmetro user é obrigatório para autenticação server-side
    const response = await tempChannel.sendImage(
      readable,
      fileName,
      contentType,
      { id: userId }
    );

    // Remover canal temporário
    await tempChannel.delete();

    return response.file;
  } catch (error) {
    console.error('Erro ao fazer upload de imagem:', error);
    throw error;
  }
}
