import { NextRequest, NextResponse } from 'next/server';
import { uploadAvatar } from '@/lib/storage';

/**
 * POST /api/upload/avatar
 * Upload de avatar de usuário para Supabase Storage
 *
 * Body: FormData com campo 'file' e opcional 'userId'
 * Retorna: { url: string } - URL pública do avatar no Supabase
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const userId = formData.get('userId') as string | null;

    // Validações
    if (!file) {
      return NextResponse.json(
        { error: 'Arquivo não fornecido' },
        { status: 400 }
      );
    }

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não permitido. Use JPG, PNG ou WebP' },
        { status: 400 }
      );
    }

    // Validar tamanho (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB em bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo 5MB' },
        { status: 400 }
      );
    }

    // Upload para Supabase Storage
    const result = await uploadAvatar(file, userId || undefined);

    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: result.url,
      message: 'Avatar enviado com sucesso'
    });

  } catch (error) {
    console.error('Erro no upload de avatar:', error);
    return NextResponse.json(
      { error: 'Erro ao fazer upload do avatar' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/upload/avatar
 * Retorna informações sobre o endpoint
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/upload/avatar',
    method: 'POST',
    contentType: 'multipart/form-data',
    fields: {
      file: 'File (required) - JPG, PNG ou WebP',
      userId: 'string (optional) - ID do usuário para nomear o arquivo'
    },
    limits: {
      maxSize: '5MB',
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
    },
    response: {
      success: '{ url: string, message: string }',
      error: '{ error: string }'
    }
  });
}
