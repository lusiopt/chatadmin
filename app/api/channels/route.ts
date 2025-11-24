import { NextRequest, NextResponse } from "next/server";
import { listChannels, createChannel } from "@/lib/stream-chat";

// GET /api/channels - Lista todos os canais
export async function GET(request: NextRequest) {
  try {
    const channels = await listChannels();

    return NextResponse.json({
      success: true,
      channels,
    });
  } catch (error) {
    console.error("Erro ao listar canais:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

// POST /api/channels - Cria um novo canal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { id, type = "messaging", name, image, members = [], data = {} } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "ID do canal é obrigatório",
        },
        { status: 400 }
      );
    }

    const channel = await createChannel({
      id,
      type,
      name,
      image,
      members,
      data,
    });

    return NextResponse.json({
      success: true,
      channel: {
        id: channel.id,
        type: channel.type,
        name: channel.data?.name,
      },
    });
  } catch (error) {
    console.error("Erro ao criar canal:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
