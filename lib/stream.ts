/**
 * Stream SDK v3 Unificado
 *
 * Este arquivo centraliza TODAS as operações com Stream:
 * - Chat (canais, membros, mensagens)
 * - Feeds (avisos, activities)
 * - Users (sync, CRUD)
 * - Upload (imagens para CDN)
 *
 * @package @stream-io/node-sdk v0.7.21
 */

import { StreamClient } from '@stream-io/node-sdk';
import { File } from 'buffer';

// Singleton instance
let client: StreamClient | null = null;

/**
 * Retorna instância singleton do StreamClient
 */
export function getStreamClient(): StreamClient {
  if (!client) {
    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
    const secret = process.env.STREAM_SECRET;

    if (!apiKey || !secret) {
      throw new Error('Missing Stream credentials (NEXT_PUBLIC_STREAM_API_KEY or STREAM_SECRET)');
    }

    client = new StreamClient(apiKey, secret);
  }
  return client;
}

// ============================================================================
// TIPOS
// ============================================================================

export interface ChannelData {
  id: string;
  type: string;
  name?: string;
  image?: string;
  member_count?: number;
  created_at?: string | Date;
  updated_at?: string | Date;
  created_by?: { id: string; name?: string };
  temas?: string[];
  [key: string]: any;
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

// Tipos de attachment compatíveis com Stream
export interface StreamAttachment {
  type: 'image' | 'video' | 'link';
  imageUrl?: string;
  thumbUrl?: string;
  assetUrl?: string;
  title?: string;
  titleLink?: string;
  text?: string;
  ogScrapeUrl?: string;
  originalWidth?: number;
  originalHeight?: number;
}

export interface AnnouncementActivityData {
  id: string;
  title: string;
  content: string;
  status: 'draft' | 'published';
  template?: 'hero' | 'card' | 'gallery' | 'video' | 'link' | 'minimal';
  attachments?: StreamAttachment[];
  image_url?: string;
  link_url?: string;
  link_text?: string;
  temas: Array<{ slug: string; nome: string; cor: string }>;
  importancias?: Array<{ slug: string; nome: string; cor: string }>;
  created_at: string;
}

export interface ImageUploadResponse {
  file: string;
  thumbUrl?: string;
}

// ============================================================================
// CHAT - Canais e Membros
// ============================================================================

/**
 * Lista canais com filtros
 */
export async function listChannels(
  filters: Record<string, any> = {},
  sort: Record<string, number> = { created_at: -1 },
  options: { limit?: number } = { limit: 30 }
): Promise<ChannelData[]> {
  const streamClient = getStreamClient();

  const response = await streamClient.chat.queryChannels({
    filter_conditions: filters,
    sort: [sort],
    limit: options.limit,
  });

  return (response.channels || []).map(ch => {
    const channel = ch.channel as any;
    // SDK v3: name e image estão em channel.custom
    return {
      id: channel?.id || '',
      type: channel?.type || 'messaging',
      name: channel?.name || channel?.custom?.name,
      image: channel?.image || channel?.custom?.image,
      member_count: channel?.member_count,
      created_at: channel?.created_at,
      updated_at: channel?.updated_at,
      created_by: channel?.created_by as { id: string; name?: string } | undefined,
      temas: channel?.temas || channel?.custom?.temas as string[] | undefined,
    };
  });
}

/**
 * Obtém ou cria um canal (idempotente)
 */
export async function getChannel(
  type: string,
  id: string
): Promise<ChannelData | null> {
  try {
    const streamClient = getStreamClient();

    const response = await streamClient.chat.getOrCreateChannel({
      type,
      id,
      data: {},
    });

    if (!response.channel) return null;

    const channel = response.channel as any;
    // SDK v3: name e image estão em channel.custom
    return {
      id: channel.id || id,
      type: channel.type || type,
      name: channel.name || channel.custom?.name,
      image: channel.image || channel.custom?.image,
      member_count: channel.member_count,
      created_at: channel.created_at,
      updated_at: channel.updated_at,
      created_by: channel.created_by as { id: string; name?: string } | undefined,
      temas: channel.temas || channel.custom?.temas as string[] | undefined,
    };
  } catch (error) {
    console.error('Erro ao buscar canal:', error);
    return null;
  }
}

/**
 * Cria um novo canal
 */
export async function createChannel(params: CreateChannelParams): Promise<ChannelData> {
  const streamClient = getStreamClient();

  const response = await streamClient.chat.getOrCreateChannel({
    type: params.type,
    id: params.id,
    data: {
      name: params.name,
      image: params.image,
      members: params.members?.map(userId => ({ user_id: userId })),
      created_by_id: 'admin',
      ...params.data,
    } as any,
  });

  const channel = response.channel as any;
  return {
    id: channel?.id || params.id,
    type: channel?.type || params.type,
    name: channel?.name,
    image: channel?.image,
    member_count: channel?.member_count,
    created_at: channel?.created_at,
    updated_at: channel?.updated_at,
  };
}

/**
 * Atualiza um canal existente
 */
export async function updateChannel(
  type: string,
  id: string,
  params: UpdateChannelParams
): Promise<ChannelData> {
  const streamClient = getStreamClient();

  const updateData: Record<string, any> = {};
  // Só incluir campos com valores válidos (não vazios)
  if (params.name !== undefined && params.name !== '') updateData.name = params.name;
  if (params.image !== undefined && params.image !== '') updateData.image = params.image;
  if (params.data && Object.keys(params.data).length > 0) Object.assign(updateData, params.data);

  // Se não há nada para atualizar, retornar o canal atual sem fazer request
  if (Object.keys(updateData).length === 0) {
    const currentChannel = await getChannel(type, id);
    if (!currentChannel) throw new Error('Canal não encontrado');
    return currentChannel;
  }

  // SDK v3: usar updateChannelPartial para partial updates com 'set'
  const response = await streamClient.chat.updateChannelPartial({
    type,
    id,
    set: updateData,
  });

  const channel = response.channel as any;
  // SDK v3: name e image estão em channel.custom
  return {
    id: channel?.id || id,
    type: channel?.type || type,
    name: channel?.name || channel?.custom?.name,
    image: channel?.image || channel?.custom?.image,
    member_count: channel?.member_count,
    created_at: channel?.created_at,
    updated_at: channel?.updated_at,
  };
}

/**
 * Deleta um canal
 */
export async function deleteChannel(type: string, id: string): Promise<void> {
  const streamClient = getStreamClient();
  await streamClient.chat.deleteChannel({ type, id });
}

/**
 * Adiciona membros a um canal
 */
export async function addMembers(
  type: string,
  id: string,
  userIds: string[]
): Promise<void> {
  const streamClient = getStreamClient();

  console.log(`[addMembers] Adicionando membros ao canal ${type}:${id}:`, userIds);

  const response = await streamClient.chat.updateChannel({
    type,
    id,
    add_members: userIds.map(userId => ({ user_id: userId })),
  });

  console.log(`[addMembers] Resposta do Stream:`, JSON.stringify(response, null, 2));
}

/**
 * Remove membros de um canal
 */
export async function removeMembers(
  type: string,
  id: string,
  userIds: string[]
): Promise<void> {
  const streamClient = getStreamClient();

  await streamClient.chat.updateChannel({
    type,
    id,
    remove_members: userIds,
  });
}

/**
 * Lista membros de um canal
 */
export async function listMembers(
  type: string,
  id: string
): Promise<Array<{ user_id: string; user?: any; role?: string; created_at?: string | Date }>> {
  const streamClient = getStreamClient();

  console.log(`[listMembers] Buscando membros do canal ${type}:${id}`);

  // SDK v3: usar getOrCreateChannel com state:true para obter membros
  const response = await streamClient.chat.getOrCreateChannel({
    type,
    id,
    data: {
      // Forçar retorno de state com membros
    },
  });

  const members = (response as any).members || [];
  console.log(`[listMembers] Encontrados ${members.length} membros`);

  return members.map((member: any) => ({
    user_id: member.user_id || member.user?.id || '',
    user: member.user,
    role: member.role as string | undefined,
    created_at: member.created_at,
  }));
}

// ============================================================================
// USERS - Gerenciamento de Usuários
// ============================================================================

/**
 * Cria ou atualiza um usuário no Stream
 */
export async function upsertUser(userData: {
  id: string;
  name?: string;
  image?: string;
  role?: string;
  custom?: Record<string, any>;
}): Promise<void> {
  const streamClient = getStreamClient();

  await streamClient.upsertUsers([
    {
      id: userData.id,
      name: userData.name,
      image: userData.image,
      role: userData.role,
      ...userData.custom,
    },
  ]);
}

/**
 * Deleta um usuário do Stream
 */
export async function deleteUser(
  userId: string,
  options: { mark_messages_deleted?: boolean; hard_delete?: boolean } = {}
): Promise<void> {
  const streamClient = getStreamClient();

  await streamClient.deleteUsers({
    user_ids: [userId],
    user: options.hard_delete ? 'hard' : 'soft',
    messages: options.mark_messages_deleted ? 'hard' : 'soft',
  });
}

/**
 * Busca usuários com filtros
 */
export async function queryUsers(
  filters: Record<string, any> = {},
  sort: Array<Record<string, number>> = [{ created_at: -1 }],
  options: { limit?: number } = { limit: 100 }
): Promise<Array<{ id: string; name?: string; image?: string; role?: string; created_at?: string | Date }>> {
  const streamClient = getStreamClient();

  const response = await streamClient.queryUsers({
    filter_conditions: filters,
    sort,
    limit: options.limit,
  } as any);

  return (response.users || []).map(user => ({
    id: user.id,
    name: user.name,
    image: user.image,
    role: user.role,
    created_at: user.created_at,
  }));
}

/**
 * Busca canais de um usuário (para verificação de membership)
 */
export async function queryChannelsForUser(
  filters: Record<string, any>
): Promise<Array<{ type: string; id: string; members: Record<string, any>; data: any }>> {
  const streamClient = getStreamClient();

  const response = await streamClient.chat.queryChannels({
    filter_conditions: filters,
    limit: 100,
  });

  return (response.channels || []).map(ch => ({
    type: ch.channel?.type || 'messaging',
    id: ch.channel?.id || '',
    members: ch.members?.reduce((acc, m) => {
      if (m.user_id) acc[m.user_id] = m;
      return acc;
    }, {} as Record<string, any>) || {},
    data: ch.channel || {},
  }));
}

// ============================================================================
// FEEDS - Avisos e Activities
// ============================================================================

/**
 * Garante que um Feed existe (cria grupo + feed automaticamente)
 * getOrCreateFeed cria o Feed Group se não existir, e depois o Feed
 */
export async function ensureFeed(groupId: string, feedId: string = 'global'): Promise<void> {
  const streamClient = getStreamClient();

  try {
    await streamClient.feeds.getOrCreateFeed({
      type: groupId,
      id: feedId,
      data: {}
    });
    console.log(`✅ Feed ${groupId}:${feedId} garantido`);
  } catch (error) {
    console.error(`Erro ao criar Feed ${groupId}:${feedId}:`, error);
    throw error; // Propagar erro para não falhar silenciosamente
  }
}

/**
 * Publica aviso para múltiplos feeds
 */
export async function publishAnnouncement(
  temaSlugs: string[],
  data: AnnouncementActivityData
): Promise<string[]> {
  const streamClient = getStreamClient();

  // Garantir que os Feeds existem (grupo + feed)
  for (const slug of temaSlugs) {
    await ensureFeed(slug, 'global');
  }

  // Construir lista de feeds no formato "grupo:id"
  const feeds = temaSlugs.map(slug => `${slug}:global`);

  try {
    // Construir attachments para imagens (campo nativo do Stream)
    const attachments = data.image_url ? [{
      type: 'image',
      image_url: data.image_url,
      thumb_url: data.image_url,
    }] : [];

    const response = await streamClient.feeds.addActivity({
      type: 'announce',
      feeds: feeds,
      text: data.content.substring(0, 200),
      id: `announcement:${data.id}`,
      user_id: 'admin',
      // Attachments para mídia (campo nativo)
      attachments: attachments,
      // Custom fields para metadados de texto
      custom: {
        message: data.content.substring(0, 200),
        fullContent: data.content,
        title: data.title,
        tema: data.temas[0]?.nome || '',
        importancia: data.importancias?.[0]?.nome || 'Normal',
        template: data.template || 'hero',
        link_url: data.link_url || '',
        link_text: data.link_text || '',
        temas: data.temas,
        importancias: data.importancias,
        created_at: data.created_at,
      },
    } as any);

    return response.activity?.id ? [response.activity.id] : [];
  } catch (error) {
    console.error('Erro ao publicar aviso:', error);
    throw error;
  }
}

/**
 * Remove aviso de feeds
 */
export async function removeAnnouncementFromFeeds(
  temaSlugs: string[],
  announcementId: string
): Promise<void> {
  const streamClient = getStreamClient();

  try {
    await streamClient.feeds.deleteActivity({
      id: `announcement:${announcementId}`,
      hard_delete: false,
    });
  } catch (error) {
    console.error(`Erro ao remover aviso ${announcementId}:`, error);
  }
}

/**
 * Lista avisos de um feed
 */
export async function listAnnouncementsFromFeed(
  temaSlug: string,
  limit = 50
): Promise<any[]> {
  const streamClient = getStreamClient();

  try {
    const response = await streamClient.feeds.queryActivities({
      filter: {
        feeds: { $in: [`${temaSlug}:global`] },
      },
      limit: limit,
    });

    return response.activities || [];
  } catch (error) {
    console.error(`Erro ao listar avisos do feed ${temaSlug}:global:`, error);
    throw error;
  }
}

// ============================================================================
// UPLOAD - Imagens para CDN
// ============================================================================

/**
 * Upload de imagem para o Stream CDN
 */
export async function uploadImage(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<ImageUploadResponse> {
  const streamClient = getStreamClient();

  try {
    const file = new File([buffer], filename, { type: contentType });

    const response = await streamClient.uploadImage({
      file: file,
      user: { id: 'admin' },
      upload_sizes: [
        { width: 1920, height: 1080, resize: 'scale', crop: 'center' },
      ],
    });

    return {
      file: response.file || '',
      thumbUrl: (response as any).thumb_url,
    };
  } catch (error: any) {
    console.error('Stream upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
}

/**
 * Verifica se o cliente está configurado
 */
export function isStreamConfigured(): boolean {
  try {
    getStreamClient();
    return true;
  } catch {
    return false;
  }
}
