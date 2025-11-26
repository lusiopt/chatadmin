import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/importancias
 * Lista todas as importâncias
 * Query params:
 *   - ativo: boolean (filtrar apenas ativos)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ativo = searchParams.get('ativo');

    let query = supabaseAdmin
      .from('importancias')
      .select('*')
      .order('ordem', { ascending: true });

    // Filtrar apenas ativos se especificado
    if (ativo === 'true') {
      query = query.eq('ativo', true);
    }

    const { data: importancias, error } = await query;

    if (error) {
      console.error('Erro ao buscar importancias:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar importancias' },
        { status: 500 }
      );
    }

    return NextResponse.json({ importancias: importancias || [] });
  } catch (error) {
    console.error('Erro na API de importancias:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/importancias
 * Cria nova importancia
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome, slug, descricao, cor = 'gray', icone, ordem } = body;

    // Validacoes basicas
    if (!nome || !slug) {
      return NextResponse.json(
        { error: 'Nome e slug sao obrigatorios' },
        { status: 400 }
      );
    }

    // Validar formato do slug (apenas letras minusculas, numeros e hifens)
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      return NextResponse.json(
        { error: 'Slug deve conter apenas letras minusculas, numeros e hifens' },
        { status: 400 }
      );
    }

    // Calcular ordem se nao fornecida (colocar no final)
    let ordemFinal = ordem;
    if (ordemFinal === undefined) {
      const { data: ultimaImportancia } = await supabaseAdmin
        .from('importancias')
        .select('ordem')
        .order('ordem', { ascending: false })
        .limit(1)
        .single();

      ordemFinal = (ultimaImportancia?.ordem || 0) + 1;
    }

    // Criar importancia
    const { data: importancia, error } = await supabaseAdmin
      .from('importancias')
      .insert({
        nome,
        slug,
        descricao,
        cor,
        icone,
        ordem: ordemFinal,
        ativo: true
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar importancia:', error);

      // Slug duplicado
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Ja existe uma importancia com esse slug' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: 'Erro ao criar importancia' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      importancia,
      message: 'Importancia criada com sucesso'
    }, { status: 201 });

  } catch (error) {
    console.error('Erro na criacao de importancia:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
