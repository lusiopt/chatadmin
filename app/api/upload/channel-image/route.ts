import { NextRequest, NextResponse } from "next/server";
import { uploadChannelImage } from "@/lib/stream-chat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/upload/channel-image - Faz upload de imagem para Stream CDN
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: "Nenhum arquivo fornecido",
        },
        { status: 400 }
      );
    }

    // Validar tipo de arquivo
    if (!file.type.match(/^image\/(jpeg|jpg|png|webp|gif)$/)) {
      return NextResponse.json(
        {
          success: false,
          error: "Tipo de arquivo inválido. Use JPG, PNG, WebP ou GIF",
        },
        { status: 400 }
      );
    }

    // Validar tamanho (máximo 100MB - limite do Stream Chat)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: "Arquivo muito grande. Tamanho máximo: 100MB",
        },
        { status: 400 }
      );
    }

    // Converter File para Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Obter userId do header (preparado para autenticação futura)
    // Por enquanto usa 'admin' como default
    const userId = request.headers.get("x-user-id") || "admin";

    // Fazer upload para Stream CDN
    const imageUrl = await uploadChannelImage(buffer, file.name, file.type, userId);

    return NextResponse.json({
      success: true,
      url: imageUrl,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error("Erro ao fazer upload de imagem:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao fazer upload",
      },
      { status: 500 }
    );
  }
}
