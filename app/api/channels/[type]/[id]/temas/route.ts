import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { updateChannel } from '@/lib/stream-chat';

/**
 * GET /api/channels/[type]/[id]/temas
 * Lista os temas associados a um canal
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ type: string; id: string }> }
) {
  const params = await context.params;
  try {
    const { type, id } = params;
    const streamChannelId = `${type}:${id}`;

    // Buscar temas do canal com join para pegar dados completos do tema
    const { data: channelTemas, error } = await supabaseAdmin
      .from('channel_temas')
      .select(`
        id,
        tema_id,
        created_at,
        temas (
          id,
          slug,
          nome,
          descricao,
          cor,
          icone,
          ativo,
          ordem
        )
      `)
      .eq('stream_channel_id', streamChannelId);

    if (error) {
      console.error('Erro ao buscar temas do canal:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar temas do canal' },
        { status: 500 }
      );
    }

    // Extrair apenas os dados dos temas
    const temas = channelTemas?.map(ct => ct.temas).filter(Boolean) || [];

    return NextResponse.json({
      success: true,
      channel_id: streamChannelId,
      temas,
    });
  } catch (error) {
    console.error('Erro na API de temas do canal:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/channels/[type]/[id]/temas
 * Atualiza os temas de um canal (replace all)
 * Body: { tema_ids: string[] }
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ type: string; id: string }> }
) {
  const params = await context.params;
  try {
    const { type, id } = params;
    const streamChannelId = `${type}:${id}`;
    const body = await request.json();

    const { tema_ids } = body;

    // Validar que tema_ids é um array
    if (!Array.isArray(tema_ids)) {
      return NextResponse.json(
        { error: 'tema_ids deve ser um array' },
        { status: 400 }
      );
    }

    // Deletar todas as relações existentes
    const { error: deleteError } = await supabaseAdmin
      .from('channel_temas')
      .delete()
      .eq('stream_channel_id', streamChannelId);

    if (deleteError) {
      console.error('Erro ao remover temas antigos:', deleteError);
      return NextResponse.json(
        { error: 'Erro ao atualizar temas do canal' },
        { status: 500 }
      );
    }

    // Se tem novos temas para adicionar
    if (tema_ids.length > 0) {
      // Criar novas relações
      const relations = tema_ids.map((tema_id: string) => ({
        stream_channel_id: streamChannelId,
        tema_id,
      }));

      const { error: insertError } = await supabaseAdmin
        .from('channel_temas')
        .insert(relations);

      if (insertError) {
        console.error('Erro ao inserir novos temas:', insertError);
        return NextResponse.json(
          { error: 'Erro ao atualizar temas do canal' },
          { status: 500 }
        );
      }
    }

    // Buscar os temas atualizados (com slug para sincronizar com Stream)
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

    const temas = channelTemas?.map(ct => ct.temas).filter(Boolean) || [];

    // Sincronizar temas com Stream Chat (para filtragem client-side)
    const temaSlugs = temas.map((t: any) => t.slug);
    try {
      await updateChannel(type, id, {
        data: { temas: temaSlugs }
      });
      console.log(`[SYNC] Canal ${streamChannelId} sincronizado com temas:`, temaSlugs);
    } catch (syncError) {
      console.error('Erro ao sincronizar temas com Stream:', syncError);
      // Não falha a operação, apenas loga o erro
    }

    return NextResponse.json({
      success: true,
      message: 'Temas atualizados com sucesso',
      channel_id: streamChannelId,
      temas,
    });
  } catch (error) {
    console.error('Erro ao atualizar temas do canal:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
