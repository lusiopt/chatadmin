import { NextRequest, NextResponse } from 'next/server';
import { uploadChannelIcon } from '@/lib/storage';

/**
 * POST /api/upload/channel-icon
 * Upload de ícone de canal para Supabase Storage
 *
 * Body: FormData com campo 'file' e opcional 'channelId'
 * Retorna: { url: string } - URL pública do ícone no Supabase
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const channelId = formData.get('channelId') as string | null;

    // Validações
    if (!file) {
      return NextResponse.json(
        { error: 'Arquivo não fornecido' },
        { status: 400 }
      );
    }

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não permitido. Use JPG ou PNG' },
        { status: 400 }
      );
    }

    // Validar tamanho (1MB - ícones devem ser pequenos)
    const maxSize = 1 * 1024 * 1024; // 1MB em bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo 1MB para ícones' },
        { status: 400 }
      );
    }

    // Upload para Supabase Storage
    const result = await uploadChannelIcon(file, channelId || undefined);

    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: result.url,
      message: 'Ícone enviado com sucesso'
    });

  } catch (error) {
    console.error('Erro no upload de ícone:', error);
    return NextResponse.json(
      { error: 'Erro ao fazer upload do ícone' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/upload/channel-icon
 * Retorna informações sobre o endpoint
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/upload/channel-icon',
    method: 'POST',
    contentType: 'multipart/form-data',
    fields: {
      file: 'File (required) - JPG ou PNG',
      channelId: 'string (optional) - ID do canal para nomear o arquivo'
    },
    limits: {
      maxSize: '1MB',
      allowedTypes: ['image/jpeg', 'image/png']
    },
    response: {
      success: '{ url: string, message: string }',
      error: '{ error: string }'
    },
    note: 'Ícones são armazenados no Supabase Storage e retornam URL pública'
  });
}
