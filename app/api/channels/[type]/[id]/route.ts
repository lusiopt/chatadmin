import { NextRequest, NextResponse } from "next/server";
import { getChannel, updateChannel, deleteChannel } from "@/lib/stream";

// GET /api/channels/[type]/[id] - Obtém detalhes de um canal
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ type: string; id: string }> }
) {
  const params = await context.params;
  try {
    const { type, id } = params;

    const channel = await getChannel(type, id);

    if (!channel) {
      return NextResponse.json(
        {
          success: false,
          error: "Canal não encontrado",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      channel: {
        id: channel.id,
        type: channel.type,
        name: channel.name,
        image: channel.image,
        member_count: channel.member_count,
        created_at: channel.created_at,
        updated_at: channel.updated_at,
        created_by: channel.created_by,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar canal:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

// PATCH /api/channels/[type]/[id] - Atualiza um canal
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ type: string; id: string }> }
) {
  const params = await context.params;
  try {
    const { type, id } = params;
    const body = await request.json();

    const { name, image, data = {} } = body;

    const channel = await updateChannel(type, id, {
      name,
      image,
      data,
    });

    return NextResponse.json({
      success: true,
      channel: {
        id: channel.id,
        type: channel.type,
        name: channel.name,
      },
    });
  } catch (error) {
    console.error("Erro ao atualizar canal:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/channels/[type]/[id] - Deleta um canal
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ type: string; id: string }> }
) {
  const params = await context.params;
  try {
    const { type, id } = params;

    await deleteChannel(type, id);

    return NextResponse.json({
      success: true,
      message: "Canal deletado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao deletar canal:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
