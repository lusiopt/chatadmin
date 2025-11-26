/**
 * Script para restaurar o usuário admin deletado no Stream Chat
 *
 * O Stream Chat faz soft delete por padrão, então podemos restaurar o usuário
 * usando o método restoreUsers do SDK.
 *
 * Uso: node scripts/restore-admin-user.js
 */

const { StreamChat } = require('stream-chat');

async function restoreAdminUser() {
  const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY || 'gabuv8nu8azd';
  const secret = process.env.STREAM_SECRET || 'jf3qa9jg972vefjggakpt2vwcmbupkxghygbhz4ehfy3b254m9963wnzjgu8yd76';

  console.log('Conectando ao Stream Chat...');
  const client = StreamChat.getInstance(apiKey, secret);

  try {
    // Tentar restaurar o usuário admin
    console.log('Tentando restaurar usuário admin...');

    // Método 1: restoreUsers (disponível em versões recentes)
    try {
      const result = await client.restoreUsers(['admin']);
      console.log('✅ Usuário admin restaurado com sucesso!');
      console.log('Resultado:', JSON.stringify(result, null, 2));
      return;
    } catch (e) {
      console.log('Método restoreUsers falhou:', e.message);
    }

    // Método 2: Usar API REST diretamente
    console.log('Tentando via API REST...');
    try {
      const response = await client.post(client.baseURL + '/users', {
        users: {
          admin: {
            id: 'admin',
            name: 'Admin',
            role: 'admin'
          }
        }
      });
      console.log('✅ Usuário criado via API REST!');
      console.log('Resultado:', JSON.stringify(response, null, 2));
      return;
    } catch (e) {
      console.log('API REST falhou:', e.message);
    }

    // Método 3: Tentar reactivateUsers se existir
    console.log('Tentando reactivateUsers...');
    try {
      if (typeof client.reactivateUsers === 'function') {
        const result = await client.reactivateUsers(['admin']);
        console.log('✅ Usuário reativado!');
        console.log('Resultado:', JSON.stringify(result, null, 2));
        return;
      } else {
        console.log('Método reactivateUsers não disponível nesta versão');
      }
    } catch (e) {
      console.log('reactivateUsers falhou:', e.message);
    }

    console.log('\n❌ Não foi possível restaurar o usuário admin automaticamente.');
    console.log('Opções:');
    console.log('1. Acessar o Stream Dashboard e restaurar manualmente');
    console.log('2. Usar um ID de usuário diferente para created_by_id no código');

  } catch (error) {
    console.error('Erro geral:', error);
  }
}

restoreAdminUser();
