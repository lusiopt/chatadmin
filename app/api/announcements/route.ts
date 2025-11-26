import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { publishAnnouncement, AnnouncementActivityData } from '@/lib/stream-feeds';

/**
 * GET /api/announcements
 * Lista todos os avisos com seus temas e importancias
 * Query params:
 *   - tema_id: string (filtrar por tema)
 *   - status: 'draft' | 'published' (filtrar por status)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const temaId = searchParams.get('tema_id');
    const status = searchParams.get('status');

    // Base query com join para buscar temas e importancias
    let query = supabaseAdmin
      .from('announcements')
      .select(`
        *,
        announcement_temas (
          tema_id,
          temas (
            id,
            slug,
            nome,
            cor
          )
        ),
        announcement_importancias (
          importancia_id,
          importancias (
            id,
            slug,
            nome,
            cor
          )
        )
      `)
      .order('created_at', { ascending: false });

    // Filtrar por status
    if (status === 'draft' || status === 'published') {
      query = query.eq('status', status);
    }

    const { data: announcements, error } = await query;

    if (error) {
      console.error('Erro ao buscar avisos:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar avisos' },
        { status: 500 }
      );
    }

    // Transformar dados para formato mais amigavel
    const formatted = (announcements || []).map(announcement => {
      const temas = announcement.announcement_temas?.map((at: any) => at.temas).filter(Boolean) || [];
      const importancias = announcement.announcement_importancias?.map((ai: any) => ai.importancias).filter(Boolean) || [];
      return {
        ...announcement,
        temas,
        importancias,
        announcement_temas: undefined, // remover campo intermediario
        announcement_importancias: undefined // remover campo intermediario
      };
    });

    // Filtrar por tema_id se especificado (apos transformacao)
    let result = formatted;
    if (temaId) {
      result = formatted.filter(a =>
        a.temas.some((t: any) => t.id === temaId)
      );
    }

    return NextResponse.json({ announcements: result });
  } catch (error) {
    console.error('Erro na API de avisos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/announcements
 * Cria novo aviso com multiplos temas e importancias
 * Body:
 *   - title: string (obrigatorio)
 *   - content: string (obrigatorio)
 *   - tema_ids: string[] (obrigatorio - array de UUIDs)
 *   - importancia_ids: string[] (obrigatorio - array de UUIDs)
 *   - status: 'draft' | 'published'
 *   - template: 'hero' | 'card' | 'gallery' | 'video' | 'link' | 'minimal' (default: 'hero')
 *   - attachments: array de attachments Stream-compatible
 *   - image_url: string (opcional - backwards compat)
 *   - link_url: string (opcional - backwards compat)
 *   - link_text: string (opcional - backwards compat)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      content,
      tema_ids,
      importancia_ids,
      status = 'draft',
      template = 'hero',
      attachments = [],
      image_url,
      link_url,
      link_text
    } = body;

    // Validacoes basicas
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Titulo e conteudo sao obrigatorios' },
        { status: 400 }
      );
    }

    if (!tema_ids || !Array.isArray(tema_ids) || tema_ids.length === 0) {
      return NextResponse.json(
        { error: 'Pelo menos um tema deve ser selecionado' },
        { status: 400 }
      );
    }

    if (!importancia_ids || !Array.isArray(importancia_ids) || importancia_ids.length === 0) {
      return NextResponse.json(
        { error: 'Pelo menos uma importancia deve ser selecionada' },
        { status: 400 }
      );
    }

    // Buscar temas para obter slugs e validar que existem
    const { data: temas, error: temasError } = await supabaseAdmin
      .from('temas')
      .select('id, slug, nome, cor')
      .in('id', tema_ids);

    if (temasError || !temas || temas.length === 0) {
      return NextResponse.json(
        { error: 'Temas invalidos' },
        { status: 400 }
      );
    }

    // Buscar importancias para validar que existem
    const { data: importancias, error: importanciasError } = await supabaseAdmin
      .from('importancias')
      .select('id, slug, nome, cor')
      .in('id', importancia_ids);

    if (importanciasError || !importancias || importancias.length === 0) {
      return NextResponse.json(
        { error: 'Importancias invalidas' },
        { status: 400 }
      );
    }

    // Criar aviso
    const { data: announcement, error: createError } = await supabaseAdmin
      .from('announcements')
      .insert({
        title,
        content,
        status,
        image_url: image_url || null,
        link_url: link_url || null,
        link_text: link_text || null
      })
      .select()
      .single();

    if (createError) {
      console.error('Erro ao criar aviso:', createError);
      return NextResponse.json(
        { error: 'Erro ao criar aviso' },
        { status: 500 }
      );
    }

    // Criar relacionamentos aviso↔temas
    const temaRelations = tema_ids.map((tema_id: string) => ({
      announcement_id: announcement.id,
      tema_id
    }));

    const { error: relError } = await supabaseAdmin
      .from('announcement_temas')
      .insert(temaRelations);

    if (relError) {
      console.error('Erro ao criar relacionamento aviso-temas:', relError);
      // Rollback: deletar aviso criado
      await supabaseAdmin.from('announcements').delete().eq('id', announcement.id);
      return NextResponse.json(
        { error: 'Erro ao associar temas ao aviso' },
        { status: 500 }
      );
    }

    // Criar relacionamentos aviso↔importancias
    const importanciaRelations = importancia_ids.map((importancia_id: string) => ({
      announcement_id: announcement.id,
      importancia_id
    }));

    const { error: impRelError } = await supabaseAdmin
      .from('announcement_importancias')
      .insert(importanciaRelations);

    if (impRelError) {
      console.error('Erro ao criar relacionamento aviso-importancias:', impRelError);
      // Rollback: deletar aviso criado (cascade vai deletar announcement_temas)
      await supabaseAdmin.from('announcements').delete().eq('id', announcement.id);
      return NextResponse.json(
        { error: 'Erro ao associar importancias ao aviso' },
        { status: 500 }
      );
    }

    // Se status=published, publicar no Stream Feeds
    if (status === 'published') {
      try {
        const activityData: AnnouncementActivityData = {
          id: announcement.id,
          title,
          content,
          status: 'published',
          template,
          attachments,
          // Campos antigos para backwards compat
          image_url,
          link_url,
          link_text,
          temas: temas.map(t => ({ slug: t.slug, nome: t.nome, cor: t.cor })),
          importancias: importancias.map(i => ({ slug: i.slug, nome: i.nome, cor: i.cor })),
          created_at: announcement.created_at
        };

        const temaSlugs = temas.map(t => t.slug);
        await publishAnnouncement(temaSlugs, activityData);
      } catch (streamError) {
        console.error('Erro ao publicar no Stream Feeds:', streamError);
        // Nao fazer rollback - aviso ja foi criado no Supabase
        // Apenas logar o erro
      }
    }

    return NextResponse.json({
      announcement: {
        ...announcement,
        temas,
        importancias
      },
      message: 'Aviso criado com sucesso'
    }, { status: 201 });

  } catch (error) {
    console.error('Erro na criacao de aviso:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
