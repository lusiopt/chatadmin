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
 * Faz upload de imagem para o Stream CDN usando o SDK
 * Retorna a URL da imagem hospedada
 */
export async function uploadChannelImage(
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  try {
    const client = getStreamChatClient();

    // Converter Buffer para Readable Stream (Node.js)
    const readable = Readable.from(file);

    // Criar canal temporário para upload
    const tempChannel = client.channel('messaging', 'file-upload');

    // Usar método nativo do SDK
    const response = await tempChannel.sendImage(
      readable,
      fileName,
      contentType,
      { id: 'admin' } // User ID para autenticação server-side
    );

    return response.file;
  } catch (error) {
    console.error('Erro ao fazer upload de imagem:', error);
    throw error;
  }
}
