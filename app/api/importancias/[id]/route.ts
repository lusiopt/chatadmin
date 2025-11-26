import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/importancias/[id]
 * Busca uma importancia especifica
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const { data: importancia, error } = await supabaseAdmin
      .from('importancias')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !importancia) {
      return NextResponse.json(
        { error: 'Importancia nao encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ importancia });
  } catch (error) {
    console.error('Erro ao buscar importancia:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/importancias/[id]
 * Atualiza uma importancia
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nome, slug, descricao, cor, icone, ativo, ordem } = body;

    // Verificar se importancia existe
    const { data: existingImportancia, error: checkError } = await supabaseAdmin
      .from('importancias')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError || !existingImportancia) {
      return NextResponse.json(
        { error: 'Importancia nao encontrada' },
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

    // Atualizar importancia
    const { data: importancia, error } = await supabaseAdmin
      .from('importancias')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar importancia:', error);

      // Slug duplicado
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Ja existe uma importancia com esse slug' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: 'Erro ao atualizar importancia' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      importancia,
      message: 'Importancia atualizada com sucesso'
    });

  } catch (error) {
    console.error('Erro na atualizacao de importancia:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/importancias/[id]
 * Desativa uma importancia (soft delete)
 * Para nao quebrar referencias existentes em announcement_importancias
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Verificar se importancia existe
    const { data: existingImportancia, error: checkError } = await supabaseAdmin
      .from('importancias')
      .select('id, slug')
      .eq('id', id)
      .single();

    if (checkError || !existingImportancia) {
      return NextResponse.json(
        { error: 'Importancia nao encontrada' },
        { status: 404 }
      );
    }

    // Soft delete: apenas desativar
    const { data: importancia, error } = await supabaseAdmin
      .from('importancias')
      .update({ ativo: false })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao desativar importancia:', error);
      return NextResponse.json(
        { error: 'Erro ao desativar importancia' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      importancia,
      message: 'Importancia desativada com sucesso'
    });

  } catch (error) {
    console.error('Erro na desativacao de importancia:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
