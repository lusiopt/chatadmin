import { connect, StreamClient } from 'getstream';

// Inicializar cliente Stream Feeds (server-side)
let client: StreamClient | null = null;

function getStreamFeedsClient(): StreamClient {
  if (!client) {
    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
    const secret = process.env.STREAM_SECRET;
    const appId = process.env.STREAM_APP_ID;

    if (!apiKey || !secret || !appId) {
      throw new Error('Missing Stream Feeds credentials (API_KEY, SECRET, or APP_ID)');
    }

    client = connect(apiKey, secret, appId);
  }
  return client;
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

// Tipos
export interface AnnouncementActivityData {
  id: string;
  title: string;
  content: string;
  status: 'draft' | 'published';
  template?: 'hero' | 'card' | 'gallery' | 'video' | 'link' | 'minimal';
  attachments?: StreamAttachment[];
  // Campos antigos para backwards compat
  image_url?: string;
  link_url?: string;
  link_text?: string;
  temas: Array<{ slug: string; nome: string; cor: string }>;
  created_at: string;
}

// Publicar aviso para múltiplos temas (feeds)
export async function publishAnnouncement(
  temaSlugs: string[],
  data: AnnouncementActivityData
): Promise<string[]> {
  const client = getStreamFeedsClient();
  const activityIds: string[] = [];

  // Publicar em cada feed de tema
  for (const slug of temaSlugs) {
    try {
      const feed = client.feed(slug, 'global');
      const activity = await feed.addActivity({
        actor: 'admin',
        verb: 'announce',
        object: `announcement:${data.id}`,
        foreign_id: `announcement:${data.id}`,
        time: new Date().toISOString(),
        // Custom fields
        title: data.title,
        content: data.content,
        message: data.content.substring(0, 200), // Preview curto
        status: data.status,
        template: data.template || 'hero',
        attachments: data.attachments || [],
        // Campos antigos para backwards compat
        image_url: data.image_url || null,
        link_url: data.link_url || null,
        link_text: data.link_text || null,
        temas: data.temas,
        importancia: 'Normal',
      });
      activityIds.push(activity.id);
    } catch (error) {
      console.error(`Erro ao publicar no feed ${slug}:global:`, error);
      throw error;
    }
  }

  return activityIds;
}

// Listar avisos de um tema específico
export async function listAnnouncementsFromFeed(
  temaSlug: string,
  limit = 50
): Promise<any[]> {
  const client = getStreamFeedsClient();

  try {
    const feed = client.feed(temaSlug, 'global');
    const response = await feed.get({ limit });
    return response.results || [];
  } catch (error) {
    console.error(`Erro ao listar avisos do feed ${temaSlug}:global:`, error);
    throw error;
  }
}

// Remover aviso de múltiplos temas (feeds)
export async function removeAnnouncementFromFeeds(
  temaSlugs: string[],
  announcementId: string
): Promise<void> {
  const client = getStreamFeedsClient();

  for (const slug of temaSlugs) {
    try {
      const feed = client.feed(slug, 'global');
      await feed.removeActivity({ foreignId: `announcement:${announcementId}` });
    } catch (error) {
      console.error(`Erro ao remover do feed ${slug}:global:`, error);
      // Continua tentando remover dos outros feeds
    }
  }
}

// Atualizar aviso em múltiplos feeds (remove e adiciona novamente)
export async function updateAnnouncementInFeeds(
  oldTemaSlugs: string[],
  newTemaSlugs: string[],
  data: AnnouncementActivityData
): Promise<void> {
  // Remover dos feeds antigos
  await removeAnnouncementFromFeeds(oldTemaSlugs, data.id);

  // Se publicado, adicionar aos novos feeds
  if (data.status === 'published') {
    await publishAnnouncement(newTemaSlugs, data);
  }
}

// Verificar se o cliente está configurado corretamente
export function isStreamFeedsConfigured(): boolean {
  try {
    getStreamFeedsClient();
    return true;
  } catch {
    return false;
  }
}
