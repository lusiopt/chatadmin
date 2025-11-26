/**
 * Script de Migração: Popular data.temas nos canais existentes do Stream Chat
 *
 * Este script:
 * 1. Busca todos os canais do Stream
 * 2. Para cada canal, busca os temas associados no Supabase (channel_temas)
 * 3. Atualiza o canal no Stream com data.temas (array de slugs)
 *
 * Uso: node scripts/migrate-channel-temas.js
 */

const { StreamChat } = require('stream-chat');
const { createClient } = require('@supabase/supabase-js');

// Credenciais (usar env vars em produção)
const STREAM_API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY || 'gabuv8nu8azd';
const STREAM_SECRET = process.env.STREAM_SECRET || 'jf3qa9jg972vefjggakpt2vwcmbupkxghygbhz4ehfy3b254m9963wnzjgu8yd76';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://admiywnhpbezcgtnebvw.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkbWl5d25ocGJlemNndG5lYnZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzk3NzUzOSwiZXhwIjoyMDc5NTUzNTM5fQ.6eXONy7Tc7DiGrArFrWX8BFG03XOXvFldFEb38bBaiA';

async function migrateChannelTemas() {
  console.log('=== Migração: Popular data.temas nos canais do Stream ===\n');

  // Inicializar clientes
  const streamClient = StreamChat.getInstance(STREAM_API_KEY, STREAM_SECRET);
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // 1. Buscar todos os canais do Stream
    console.log('1. Buscando canais do Stream...');
    const channels = await streamClient.queryChannels(
      { type: 'messaging' },
      { created_at: -1 },
      { limit: 100 }
    );
    console.log(`   Encontrados ${channels.length} canais\n`);

    if (channels.length === 0) {
      console.log('Nenhum canal para migrar.');
      return;
    }

    // 2. Buscar relações channel_temas do Supabase
    console.log('2. Buscando relações channel_temas do Supabase...');
    const { data: allChannelTemas, error: supabaseError } = await supabase
      .from('channel_temas')
      .select(`
        stream_channel_id,
        temas (
          slug
        )
      `);

    if (supabaseError) {
      console.error('Erro ao buscar channel_temas:', supabaseError);
      return;
    }

    // Criar mapa de canal -> slugs
    const channelTemasMap = {};
    allChannelTemas?.forEach(ct => {
      if (!channelTemasMap[ct.stream_channel_id]) {
        channelTemasMap[ct.stream_channel_id] = [];
      }
      if (ct.temas?.slug) {
        channelTemasMap[ct.stream_channel_id].push(ct.temas.slug);
      }
    });

    console.log(`   Encontradas ${allChannelTemas?.length || 0} relações\n`);

    // 3. Migrar cada canal
    console.log('3. Migrando canais...\n');

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const channel of channels) {
      const streamChannelId = `${channel.type}:${channel.id}`;
      const currentTemas = channel.data?.temas || [];
      const newTemas = channelTemasMap[streamChannelId] || [];

      // Verificar se já tem os temas corretos
      const temasEqual = JSON.stringify(currentTemas.sort()) === JSON.stringify(newTemas.sort());

      if (temasEqual && currentTemas.length > 0) {
        console.log(`   [SKIP] ${channel.id} - já tem temas: [${currentTemas.join(', ')}]`);
        skipped++;
        continue;
      }

      // Atualizar canal com temas
      try {
        await channel.update({
          temas: newTemas
        });

        if (newTemas.length > 0) {
          console.log(`   [OK] ${channel.id} - atualizado com temas: [${newTemas.join(', ')}]`);
        } else {
          console.log(`   [OK] ${channel.id} - sem temas associados`);
        }
        migrated++;
      } catch (updateError) {
        console.error(`   [ERRO] ${channel.id}:`, updateError.message);
        errors++;
      }
    }

    // 4. Resumo
    console.log('\n=== Resumo ===');
    console.log(`Total de canais: ${channels.length}`);
    console.log(`Migrados: ${migrated}`);
    console.log(`Ignorados (já corretos): ${skipped}`);
    console.log(`Erros: ${errors}`);

  } catch (error) {
    console.error('Erro na migração:', error);
  }
}

// Executar
migrateChannelTemas();
