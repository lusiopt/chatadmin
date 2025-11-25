import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/temas/[id]
 * Busca um tema especifico
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const { data: tema, error } = await supabaseAdmin
      .from('temas')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !tema) {
      return NextResponse.json(
        { error: 'Tema nao encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ tema });
  } catch (error) {
    console.error('Erro ao buscar tema:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/temas/[id]
 * Atualiza um tema
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nome, slug, descricao, cor, icone, ativo, ordem } = body;

    // Verificar se tema existe
    const { data: existingTema, error: checkError } = await supabaseAdmin
      .from('temas')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError || !existingTema) {
      return NextResponse.json(
        { error: 'Tema nao encontrado' },
        { status: 404 }
      );
    }

    // Validar slug se fornecido
    if (slug) {
      const slugRegex = /^[a-z0-9-]+$/;
      if (!slugRegex.test(slug)) {
        return NextResponse.json(
          { error: 'Slug deve conter apenas letras minusculas, numeros e hifens' },
          { status: 400 }
        );
      }
    }

    // Construir objeto de atualizacao (apenas campos fornecidos)
    const updateData: Record<string, any> = {};
    if (nome !== undefined) updateData.nome = nome;
    if (slug !== undefined) updateData.slug = slug;
    if (descricao !== undefined) updateData.descricao = descricao;
    if (cor !== undefined) updateData.cor = cor;
    if (icone !== undefined) updateData.icone = icone;
    if (ativo !== undefined) updateData.ativo = ativo;
    if (ordem !== undefined) updateData.ordem = ordem;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Nenhum campo para atualizar' },
        { status: 400 }
      );
    }

    // Atualizar tema
    const { data: tema, error } = await supabaseAdmin
      .from('temas')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar tema:', error);

      // Slug duplicado
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Ja existe um tema com esse slug' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: 'Erro ao atualizar tema' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      tema,
      message: 'Tema atualizado com sucesso'
    });

  } catch (error) {
    console.error('Erro na atualizacao de tema:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/temas/[id]
 * Desativa um tema (soft delete)
 * Para nao quebrar referencias existentes em user_permissions
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Verificar se tema existe
    const { data: existingTema, error: checkError } = await supabaseAdmin
      .from('temas')
      .select('id, slug')
      .eq('id', id)
      .single();

    if (checkError || !existingTema) {
      return NextResponse.json(
        { error: 'Tema nao encontrado' },
        { status: 404 }
      );
    }

    // Soft delete: apenas desativar
    const { data: tema, error } = await supabaseAdmin
      .from('temas')
      .update({ ativo: false })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao desativar tema:', error);
      return NextResponse.json(
        { error: 'Erro ao desativar tema' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      tema,
      message: 'Tema desativado com sucesso'
    });

  } catch (error) {
    console.error('Erro na desativacao de tema:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
