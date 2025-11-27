import { NextRequest, NextResponse } from "next/server";
import { listMembers, addMembers, removeMembers } from "@/lib/stream";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/channels/[type]/[id]/members - Lista membros do canal
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ type: string; id: string }> }
) {
  const params = await context.params;
  try {
    const { type, id } = params;

    const members = await listMembers(type, id);

    // Buscar dados reais dos usuários do Supabase
    const streamUserIds = members.map(m => m.user_id);

    const { data: supabaseUsers } = await supabaseAdmin
      .from("users")
      .select("id, nome, email, avatar, stream_user_id")
      .or(`stream_user_id.in.(${streamUserIds.join(",")}),id.in.(${streamUserIds.join(",")})`);

    // Criar mapa de stream_user_id/id -> dados do usuário
    const userMap = new Map<string, any>();
    supabaseUsers?.forEach(user => {
      if (user.stream_user_id) userMap.set(user.stream_user_id, user);
      if (user.id) userMap.set(user.id, user);
    });

    // Enriquecer membros com dados do Supabase
    const enrichedMembers = members.map(member => {
      const supabaseUser = userMap.get(member.user_id);
      return {
        ...member,
        user: {
          ...member.user,
          id: member.user_id,
          name: supabaseUser?.nome || member.user?.name || member.user_id,
          email: supabaseUser?.email || member.user?.email,
          image: supabaseUser?.avatar || member.user?.image,
        },
      };
    });

    return NextResponse.json({
      success: true,
      members: enrichedMembers,
    });
  } catch (error) {
    console.error("Erro ao listar membros:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

// POST /api/channels/[type]/[id]/members - Adiciona membros ao canal
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ type: string; id: string }> }
) {
  const params = await context.params;
  try {
    const { type, id } = params;
    const body = await request.json();

    const { user_ids } = body;

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "user_ids é obrigatório e deve ser um array",
        },
        { status: 400 }
      );
    }

    await addMembers(type, id, user_ids);

    return NextResponse.json({
      success: true,
      message: "Membros adicionados com sucesso",
    });
  } catch (error) {
    console.error("Erro ao adicionar membros:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/channels/[type]/[id]/members - Remove membros do canal
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ type: string; id: string }> }
) {
  const params = await context.params;
  try {
    const { type, id } = params;
    const body = await request.json();

    const { user_ids } = body;

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "user_ids é obrigatório e deve ser um array",
        },
        { status: 400 }
      );
    }

    await removeMembers(type, id, user_ids);

    return NextResponse.json({
      success: true,
      message: "Membros removidos com sucesso",
    });
  } catch (error) {
    console.error("Erro ao remover membros:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
