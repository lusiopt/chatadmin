// Tipos de attachments compatíveis com Stream Feeds v3
export type AttachmentType = 'image' | 'video' | 'link';

export interface Attachment {
  type: AttachmentType;
  // Para imagens
  imageUrl?: string;
  thumbUrl?: string;
  originalWidth?: number;
  originalHeight?: number;
  // Para vídeos
  assetUrl?: string;
  // Para links
  titleLink?: string;
  title?: string;
  text?: string;
  ogScrapeUrl?: string;
}

// Templates disponíveis
export type AnnouncementTemplate = 'hero' | 'card' | 'gallery' | 'video' | 'link' | 'minimal';

// Configuração dos templates
export const TEMPLATES: Record<AnnouncementTemplate, { label: string; description: string; available: boolean }> = {
  hero: {
    label: 'Hero',
    description: 'Imagem grande no topo + título + texto',
    available: true
  },
  card: {
    label: 'Card',
    description: 'Thumbnail ao lado do texto',
    available: false
  },
  gallery: {
    label: 'Galeria',
    description: 'Múltiplas imagens em carrossel',
    available: false
  },
  video: {
    label: 'Vídeo',
    description: 'Player de vídeo em destaque',
    available: false
  },
  link: {
    label: 'Link',
    description: 'Preview estilo Open Graph',
    available: false
  },
  minimal: {
    label: 'Minimal',
    description: 'Apenas texto, sem mídia',
    available: false
  }
};

// Helper para criar attachment de imagem
export function createImageAttachment(imageUrl: string): Attachment {
  return {
    type: 'image',
    imageUrl
  };
}

// Helper para criar attachment de link
export function createLinkAttachment(url: string, title?: string, text?: string): Attachment {
  return {
    type: 'link',
    titleLink: url,
    title: title || 'Saiba mais',
    text
  };
}

// Helper para criar attachment de vídeo
export function createVideoAttachment(assetUrl: string, thumbUrl?: string): Attachment {
  return {
    type: 'video',
    assetUrl,
    thumbUrl
  };
}
