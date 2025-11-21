import { NextResponse } from 'next/server';
import { listUsers } from '@/lib/stream-chat';

// GET /api/users - Lista todos os usuários
export async function GET() {
  try {
    const users = await listUsers();

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao listar usuários',
      },
      { status: 500 }
    );
  }
}
