import { NextRequest, NextResponse } from "next/server";
import { listChannels, createChannel } from "@/lib/stream-chat";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/channels - Lista todos os canais
// Query params:
//   - tema_id: string (filtrar por tema)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const temaId = searchParams.get('tema_id');

    // Buscar canais do Stream
    let channels = await listChannels();

    // Se filtro por tema, buscar channel_ids do Supabase
    if (temaId) {
      const { data: channelTemas, error } = await supabaseAdmin
        .from('channel_temas')
        .select('stream_channel_id')
        .eq('tema_id', temaId);

      if (error) {
        console.error('Erro ao buscar canais por tema:', error);
      } else {
        // Filtrar apenas canais que têm o tema
        const allowedChannelIds = new Set(
          channelTemas?.map(ct => ct.stream_channel_id) || []
        );
        channels = channels.filter(ch =>
          allowedChannelIds.has(`${ch.type}:${ch.id}`)
        );
      }
    }

    // Buscar temas de todos os canais para incluir na resposta
    const channelIds = channels.map(ch => `${ch.type}:${ch.id}`);

    let temasMap: Record<string, Array<{ id: string; slug: string; nome: string; cor: string }>> = {};

    if (channelIds.length > 0) {
      const { data: allChannelTemas } = await supabaseAdmin
        .from('channel_temas')
        .select(`
          stream_channel_id,
          temas (
            id,
            slug,
            nome,
            cor
          )
        `)
        .in('stream_channel_id', channelIds);

      // Agrupar temas por canal
      allChannelTemas?.forEach(ct => {
        if (!temasMap[ct.stream_channel_id]) {
          temasMap[ct.stream_channel_id] = [];
        }
        if (ct.temas) {
          const tema = ct.temas as unknown as { id: string; slug: string; nome: string; cor: string };
          temasMap[ct.stream_channel_id].push(tema);
        }
      });
    }

    // Adicionar temas a cada canal
    const channelsWithTemas = channels.map(ch => ({
      ...ch,
      temas: temasMap[`${ch.type}:${ch.id}`] || [],
    }));

    return NextResponse.json({
      success: true,
      channels: channelsWithTemas,
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
// Body: { id, type, name, image, members, data, tema_ids }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { id, type = "messaging", name, image, members = [], data = {}, tema_ids = [] } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "ID do canal é obrigatório",
        },
        { status: 400 }
      );
    }

    // Buscar slugs dos temas para salvar no Stream
    let temaSlugs: string[] = [];
    if (tema_ids.length > 0) {
      const { data: temasData } = await supabaseAdmin
        .from('temas')
        .select('slug')
        .in('id', tema_ids);

      temaSlugs = temasData?.map(t => t.slug) || [];
    }

    // Criar canal no Stream com temas no data
    const channel = await createChannel({
      id,
      type,
      name,
      image,
      members,
      data: {
        ...data,
        temas: temaSlugs, // Array de slugs para filtragem client-side
      },
    });

    // Se tem temas, criar relações no Supabase
    let temas: Array<{ id: string; slug: string; nome: string; cor: string }> = [];

    if (tema_ids.length > 0) {
      const streamChannelId = `${type}:${id}`;
      const relations = tema_ids.map((tema_id: string) => ({
        stream_channel_id: streamChannelId,
        tema_id,
      }));

      const { error: insertError } = await supabaseAdmin
        .from('channel_temas')
        .insert(relations);

      if (insertError) {
        console.error('Erro ao associar temas ao canal:', insertError);
        // Não falhar a criação do canal por causa disso
      } else {
        // Buscar os temas associados
        const { data: channelTemas } = await supabaseAdmin
          .from('channel_temas')
          .select(`
            temas (
              id,
              slug,
              nome,
              cor
            )
          `)
          .eq('stream_channel_id', streamChannelId);

        temas = (channelTemas?.map(ct => ct.temas).filter(Boolean) || []) as unknown as typeof temas;
      }
    }

    return NextResponse.json({
      success: true,
      channel: {
        id: channel.id,
        type: channel.type,
        name: channel.data?.name,
        temas,
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
