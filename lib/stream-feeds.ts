import { StreamClient } from '@stream-io/node-sdk';
import { File } from 'buffer';

// Singleton instance do SDK v3
let client: StreamClient | null = null;

function getStreamClient(): StreamClient {
  if (!client) {
    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
    const secret = process.env.STREAM_SECRET;

    if (!apiKey || !secret) {
      throw new Error('Missing Stream Feeds credentials (API_KEY or SECRET)');
    }

    client = new StreamClient(apiKey, secret);
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
  const client = getStreamClient();

  // Construir lista de feeds no formato "grupo:id"
  const feeds = temaSlugs.map(slug => `${slug}:global`);

  try {
    const response = await client.feeds.addActivity({
      type: 'announce',
      feeds: feeds,
      text: data.content.substring(0, 200), // Preview curto
      id: `announcement:${data.id}`,
      user_id: 'admin',
      // Custom fields via any cast (SDK permite campos extras)
    } as any);

    // Retornar ID da atividade criada
    return response.activity?.id ? [response.activity.id] : [];
  } catch (error) {
    console.error('Erro ao publicar aviso:', error);
    throw error;
  }
}

// Listar avisos de um tema específico
export async function listAnnouncementsFromFeed(
  temaSlug: string,
  limit = 50
): Promise<any[]> {
  const client = getStreamClient();

  try {
    const response = await client.feeds.queryActivities({
      filter: {
        feeds: { $in: [`${temaSlug}:global`] }
      },
      limit: limit
    });

    return response.activities || [];
  } catch (error) {
    console.error(`Erro ao listar avisos do feed ${temaSlug}:global:`, error);
    throw error;
  }
}

// Remover aviso de múltiplos temas (feeds) - usando ID da atividade
export async function removeAnnouncementFromFeeds(
  temaSlugs: string[],
  announcementId: string
): Promise<void> {
  const client = getStreamClient();

  // No SDK v3, deletamos pela ID da atividade
  try {
    await client.feeds.deleteActivity({
      id: `announcement:${announcementId}`,
      hard_delete: false
    });
  } catch (error) {
    console.error(`Erro ao remover aviso ${announcementId}:`, error);
    // Não propaga o erro para permitir continuar outras operações
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
    getStreamClient();
    return true;
  } catch {
    return false;
  }
}

// Resposta do upload de imagem
export interface ImageUploadResponse {
  file: string;
  thumbUrl?: string;
}

// Upload de imagem para o Stream CDN usando SDK v3 nativo
export async function uploadImage(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<ImageUploadResponse> {
  const client = getStreamClient();

  try {
    // Criar File object a partir do Buffer
    const file = new File([buffer], filename, { type: contentType });

    // Usar método nativo do SDK v3 (upload_sizes é OBRIGATÓRIO)
    const response = await client.uploadImage({
      file: file,
      user: { id: 'admin' },
      upload_sizes: [
        { width: 1920, height: 1080, resize: 'scale', crop: 'center' }
      ]
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
