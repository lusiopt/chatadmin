import { NextRequest, NextResponse } from 'next/server';
import { uploadImage } from '@/lib/stream-feeds';

/**
 * POST /api/upload/image
 * Upload de imagem para o Stream CDN (usando SDK nativo)
 *
 * Aceita: Qualquer formato de imagem
 * Limite: 10MB (limite do Stream)
 * Processamento: Feito pelo Stream automaticamente
 *
 * Body: FormData com campo 'file'
 * Response: { file: string, thumbUrl?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      );
    }

    // Validar se é uma imagem
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'O arquivo deve ser uma imagem' },
        { status: 400 }
      );
    }

    // Validar tamanho (max 10MB - limite do Stream)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo: 10MB' },
        { status: 400 }
      );
    }

    // Converter File para Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload direto para Stream CDN (SDK cuida de tudo)
    const result = await uploadImage(buffer, file.name);

    return NextResponse.json({
      file: result.file,
      thumbUrl: result.thumbUrl,
      message: 'Imagem enviada com sucesso'
    });

  } catch (error) {
    console.error('Erro no upload de imagem:', error);

    return NextResponse.json(
      { error: 'Erro ao fazer upload da imagem' },
      { status: 500 }
    );
  }
}
