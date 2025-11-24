import { supabaseAdmin } from './supabase';

export type StorageBucket = 'avatars' | 'channel-icons' | 'icon-library';

/**
 * Upload de arquivo para o Supabase Storage
 */
export async function uploadFile(
  bucket: StorageBucket,
  file: File,
  fileName?: string
): Promise<{ url: string; path: string } | { error: string }> {
  try {
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const filePath = fileName || `${timestamp}.${fileExt}`;

    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Erro no upload:', error);
      return { error: error.message };
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      url: publicUrl,
      path: data.path
    };
  } catch (error) {
    console.error('Erro no upload:', error);
    return { error: 'Erro ao fazer upload do arquivo' };
  }
}

/**
 * Delete arquivo do Supabase Storage
 */
export async function deleteFile(
  bucket: StorageBucket,
  filePath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Erro ao deletar:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar:', error);
    return { success: false, error: 'Erro ao deletar arquivo' };
  }
}

/**
 * Lista arquivos de um bucket
 */
export async function listFiles(
  bucket: StorageBucket,
  folder?: string
): Promise<{ files: string[]; error?: string }> {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .list(folder);

    if (error) {
      console.error('Erro ao listar:', error);
      return { files: [], error: error.message };
    }

    return {
      files: data.map(file => file.name)
    };
  } catch (error) {
    console.error('Erro ao listar:', error);
    return { files: [], error: 'Erro ao listar arquivos' };
  }
}

/**
 * Upload de avatar de usuário
 */
export async function uploadAvatar(
  file: File,
  userId?: string
): Promise<{ url: string } | { error: string }> {
  const fileName = userId ? `${userId}.${file.name.split('.').pop()}` : undefined;
  const result = await uploadFile('avatars', file, fileName);

  if ('error' in result) {
    return result;
  }

  return { url: result.url };
}

/**
 * Upload de ícone de canal
 */
export async function uploadChannelIcon(
  file: File,
  channelId?: string
): Promise<{ url: string } | { error: string }> {
  const fileName = channelId
    ? `${channelId}.${file.name.split('.').pop()}`
    : undefined;

  const result = await uploadFile('channel-icons', file, fileName);

  if ('error' in result) {
    return result;
  }

  return { url: result.url };
}
