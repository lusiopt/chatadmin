import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
  publishAnnouncement,
  removeAnnouncementFromFeeds,
  AnnouncementActivityData
} from '@/lib/stream-feeds';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/announcements/[id]
 * Busca um aviso especifico com seus temas e importancias
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const { data: announcement, error } = await supabaseAdmin
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
      .eq('id', id)
      .single();

    if (error || !announcement) {
      return NextResponse.json(
        { error: 'Aviso nao encontrado' },
        { status: 404 }
      );
    }

    // Formatar resposta
    const temas = announcement.announcement_temas?.map((at: any) => at.temas).filter(Boolean) || [];
    const importancias = announcement.announcement_importancias?.map((ai: any) => ai.importancias).filter(Boolean) || [];
    const formatted = {
      ...announcement,
      temas,
      importancias,
      announcement_temas: undefined,
      announcement_importancias: undefined
    };

    return NextResponse.json({ announcement: formatted });
  } catch (error) {
    console.error('Erro ao buscar aviso:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/announcements/[id]
 * Atualiza um aviso existente
 * Body:
 *   - title: string
 *   - content: string
 *   - tema_ids: string[] (se fornecido, substitui temas existentes)
 *   - importancia_ids: string[] (se fornecido, substitui importancias existentes)
 *   - status: 'draft' | 'published'
 *   - image_url: string
 *   - link_url: string
 *   - link_text: string
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, content, tema_ids, importancia_ids, status, image_url, link_url, link_text } = body;

    // Verificar se aviso existe e buscar dados atuais
    const { data: current, error: fetchError } = await supabaseAdmin
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
      .eq('id', id)
      .single();

    if (fetchError || !current) {
      return NextResponse.json(
        { error: 'Aviso nao encontrado' },
        { status: 404 }
      );
    }

    const oldTemas = current.announcement_temas?.map((at: any) => at.temas).filter(Boolean) || [];
    const oldTemaSlugs = oldTemas.map((t: any) => t.slug);
    const oldImportancias = current.announcement_importancias?.map((ai: any) => ai.importancias).filter(Boolean) || [];
    const wasPublished = current.status === 'published';

    // Preparar dados para update
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (status !== undefined) updateData.status = status;
    if (image_url !== undefined) updateData.image_url = image_url || null;
    if (link_url !== undefined) updateData.link_url = link_url || null;
    if (link_text !== undefined) updateData.link_text = link_text || null;

    // Atualizar aviso
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('announcements')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Erro ao atualizar aviso:', updateError);
      return NextResponse.json(
        { error: 'Erro ao atualizar aviso' },
        { status: 500 }
      );
    }

    // Se tema_ids foi fornecido, atualizar relacionamentos
    let newTemas = oldTemas;
    if (tema_ids && Array.isArray(tema_ids)) {
      // Buscar novos temas
      const { data: temasData, error: temasError } = await supabaseAdmin
        .from('temas')
        .select('id, slug, nome, cor')
        .in('id', tema_ids);

      if (temasError || !temasData || temasData.length === 0) {
        return NextResponse.json(
          { error: 'Temas invalidos' },
          { status: 400 }
        );
      }

      newTemas = temasData;

      // Deletar relacionamentos antigos
      await supabaseAdmin
        .from('announcement_temas')
        .delete()
        .eq('announcement_id', id);

      // Criar novos relacionamentos
      const temaRelations = tema_ids.map((tema_id: string) => ({
        announcement_id: id,
        tema_id
      }));

      const { error: relError } = await supabaseAdmin
        .from('announcement_temas')
        .insert(temaRelations);

      if (relError) {
        console.error('Erro ao atualizar relacionamento aviso-temas:', relError);
      }
    }

    // Se importancia_ids foi fornecido, atualizar relacionamentos
    let newImportancias = oldImportancias;
    if (importancia_ids && Array.isArray(importancia_ids)) {
      // Buscar novas importancias
      const { data: importanciasData, error: importanciasError } = await supabaseAdmin
        .from('importancias')
        .select('id, slug, nome, cor')
        .in('id', importancia_ids);

      if (importanciasError || !importanciasData || importanciasData.length === 0) {
        return NextResponse.json(
          { error: 'Importancias invalidas' },
          { status: 400 }
        );
      }

      newImportancias = importanciasData;

      // Deletar relacionamentos antigos
      await supabaseAdmin
        .from('announcement_importancias')
        .delete()
        .eq('announcement_id', id);

      // Criar novos relacionamentos
      const importanciaRelations = importancia_ids.map((importancia_id: string) => ({
        announcement_id: id,
        importancia_id
      }));

      const { error: impRelError } = await supabaseAdmin
        .from('announcement_importancias')
        .insert(importanciaRelations);

      if (impRelError) {
        console.error('Erro ao atualizar relacionamento aviso-importancias:', impRelError);
      }
    }

    // Gerenciar publicacao no Stream Feeds
    const newTemaSlugs = newTemas.map((t: any) => t.slug);
    const willBePublished = (status ?? current.status) === 'published';

    try {
      // Remover dos feeds antigos se estava publicado
      if (wasPublished && oldTemaSlugs.length > 0) {
        await removeAnnouncementFromFeeds(oldTemaSlugs, id);
      }

      // Publicar nos novos feeds se vai ficar publicado
      if (willBePublished && newTemaSlugs.length > 0) {
        const activityData: AnnouncementActivityData = {
          id: updated.id,
          title: updated.title,
          content: updated.content,
          status: 'published',
          image_url: updated.image_url,
          link_url: updated.link_url,
          link_text: updated.link_text,
          temas: newTemas.map((t: any) => ({ slug: t.slug, nome: t.nome, cor: t.cor })),
          importancias: newImportancias.map((i: any) => ({ slug: i.slug, nome: i.nome, cor: i.cor })),
          created_at: updated.created_at
        };
        await publishAnnouncement(newTemaSlugs, activityData);
      }
    } catch (streamError) {
      console.error('Erro ao atualizar Stream Feeds:', streamError);
      // Nao fazer rollback
    }

    return NextResponse.json({
      announcement: {
        ...updated,
        temas: newTemas,
        importancias: newImportancias
      },
      message: 'Aviso atualizado com sucesso'
    });

  } catch (error) {
    console.error('Erro na atualizacao de aviso:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/announcements/[id]
 * Deleta um aviso
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Buscar aviso para obter temas antes de deletar
    const { data: announcement, error: fetchError } = await supabaseAdmin
      .from('announcements')
      .select(`
        *,
        announcement_temas (
          tema_id,
          temas (
            slug
          )
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError || !announcement) {
      return NextResponse.json(
        { error: 'Aviso nao encontrado' },
        { status: 404 }
      );
    }

    // Obter slugs dos temas
    const temaSlugs = announcement.announcement_temas
      ?.map((at: any) => at.temas?.slug)
      .filter(Boolean) || [];

    // Remover do Stream Feeds se estava publicado
    if (announcement.status === 'published' && temaSlugs.length > 0) {
      try {
        await removeAnnouncementFromFeeds(temaSlugs, id);
      } catch (streamError) {
        console.error('Erro ao remover do Stream Feeds:', streamError);
        // Continuar com a delecao
      }
    }

    // Deletar aviso (cascade vai deletar announcement_temas)
    const { error: deleteError } = await supabaseAdmin
      .from('announcements')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Erro ao deletar aviso:', deleteError);
      return NextResponse.json(
        { error: 'Erro ao deletar aviso' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Aviso deletado com sucesso'
    });

  } catch (error) {
    console.error('Erro na delecao de aviso:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
