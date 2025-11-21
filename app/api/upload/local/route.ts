/**
 * ⚠️ SOLUÇÃO TEMPORÁRIA PARA DESENVOLVIMENTO
 *
 * Este endpoint salva arquivos localmente na VM para desenvolvimento rápido.
 *
 * TODO: Migrar para Supabase Storage em produção para:
 * - Redundância e backup automático
 * - CDN global com melhor performance
 * - Escalabilidade horizontal
 * - Integração com sistema de permissões
 *
 * Migração futura: public/uploads/ → Supabase Storage bucket 'assets'
 */

import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Tipos permitidos de upload
type UploadType = "channel-icon" | "user-avatar";

const UPLOAD_CONFIG = {
  "channel-icon": {
    folder: "channel-icons",
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ["image/png", "image/jpeg", "image/jpg", "image/webp"],
  },
  "user-avatar": {
    folder: "user-avatars",
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ["image/png", "image/jpeg", "image/jpg", "image/webp"],
  },
};

// POST /api/upload/local - Faz upload de arquivo para storage local
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = (formData.get("type") as UploadType) || "channel-icon";

    // Validar tipo de upload
    if (!UPLOAD_CONFIG[type]) {
      return NextResponse.json(
        {
          success: false,
          error: `Tipo de upload inválido: ${type}`,
        },
        { status: 400 }
      );
    }

    const config = UPLOAD_CONFIG[type];

    // Validar arquivo
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
    if (!config.allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Tipo de arquivo inválido. Use: ${config.allowedTypes.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validar tamanho
    if (file.size > config.maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: `Arquivo muito grande. Tamanho máximo: ${config.maxSize / 1024 / 1024}MB`,
        },
        { status: 400 }
      );
    }

    // Gerar nome único
    const ext = file.name.split(".").pop() || "png";
    const fileName = `${randomUUID()}.${ext}`;

    // Converter para Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Caminho completo do arquivo
    const uploadPath = join(process.cwd(), "public", "uploads", config.folder, fileName);

    // Salvar arquivo
    await writeFile(uploadPath, buffer);

    // URL pública do arquivo
    const publicUrl = `/uploads/${config.folder}/${fileName}`;

    // URL completa via proxy HTTPS
    // Quando acessado via dev.lusio.market/chat, usa HTTPS através do proxy reverso
    const host = request.headers.get("host") || "localhost:3000";

    let fullUrl: string;
    if (host.includes("localhost")) {
      // Ambiente local: usa HTTP direto
      fullUrl = `http://${host}${publicUrl}`;
    } else if (host.includes("dev.lusio.market")) {
      // Ambiente dev: já está atrás do proxy HTTPS
      fullUrl = `https://${host}${publicUrl}`;
    } else {
      // Acesso direto à VM Azure: usa proxy HTTPS da VPS
      fullUrl = `https://dev.lusio.market${publicUrl}`;
    }

    return NextResponse.json({
      success: true,
      url: fullUrl,
      path: publicUrl,
      size: file.size,
      type: file.type,
      uploadType: type,
    });
  } catch (error) {
    console.error("Erro ao fazer upload de arquivo:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao fazer upload",
      },
      { status: 500 }
    );
  }
}
