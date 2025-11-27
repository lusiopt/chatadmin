require('dotenv').config({ path: '.env.local' });
const { StreamClient } = require('@stream-io/node-sdk');

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY || process.env.STREAM_API_KEY;
const secret = process.env.STREAM_SECRET || process.env.STREAM_API_SECRET;

console.log('API Key:', apiKey ? apiKey.substring(0,8) + '...' : 'NÃO ENCONTRADA');
console.log('Secret:', secret ? '***' : 'NÃO ENCONTRADA');

if (!apiKey || !secret) {
  console.log('\nCredenciais não encontradas. Verifique .env.local');
  process.exit(1);
}

const client = new StreamClient(apiKey, secret);

async function diagnose() {
  console.log('\n=== DIAGNÓSTICO STREAM ===\n');

  // 1. Buscar todos os usuários
  console.log('1. USUÁRIOS NO STREAM:');
  try {
    const userResp = await client.queryUsers({
      limit: 20
    });
    if (userResp.users && userResp.users.length > 0) {
      for (const user of userResp.users) {
        console.log('   ---');
        console.log('   ID:', user.id);
        console.log('   Name:', user.name || '(sem nome)');
        console.log('   Role:', user.role || 'user');
        console.log('   Custom:', JSON.stringify(user.custom || {}, null, 2));
        if (user.id === 'test-user-euclides') {
          console.log('   >>> TEMAS PERMITIDOS:', user.custom?.temas_permitidos || 'NÃO DEFINIDO');
        }
      }
    } else {
      console.log('   NENHUM USUÁRIO ENCONTRADO');
    }
  } catch (e) {
    console.log('   Erro:', e.message);
  }

  console.log('\n2. CANAIS EXISTENTES:');
  try {
    const channelsResp = await client.chat.queryChannels({
      filter_conditions: {},
      limit: 20
    });
    if (channelsResp.channels && channelsResp.channels.length > 0) {
      for (const ch of channelsResp.channels) {
        const channel = ch.channel;
        console.log('   ---');
        console.log('   ID:', channel.id);
        console.log('   Type:', channel.type);
        console.log('   Name:', channel.name || '(sem nome)');
        console.log('   Temas:', JSON.stringify(channel.temas || 'NÃO DEFINIDO'));
        console.log('   Member Count:', channel.member_count);

        // Listar membros
        if (ch.members && ch.members.length > 0) {
          console.log('   Membros:', ch.members.map(m => m.user_id).join(', '));
        }
      }
    } else {
      console.log('   NENHUM CANAL ENCONTRADO');
    }
  } catch (e) {
    console.log('   Erro:', e.message);
  }
}

diagnose().catch(console.error);
