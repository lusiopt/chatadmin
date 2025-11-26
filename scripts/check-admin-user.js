/**
 * Script para verificar se o usuário admin existe no Stream Chat
 */

const { StreamChat } = require('stream-chat');

async function checkAdminUser() {
  const apiKey = 'gabuv8nu8azd';
  const secret = 'jf3qa9jg972vefjggakpt2vwcmbupkxghygbhz4ehfy3b254m9963wnzjgu8yd76';

  const client = StreamChat.getInstance(apiKey, secret);

  try {
    const response = await client.queryUsers({ id: { $eq: 'admin' } });

    if (response.users.length > 0) {
      console.log('✅ Usuário admin encontrado:');
      console.log(JSON.stringify(response.users[0], null, 2));
    } else {
      console.log('❌ Usuário admin NÃO encontrado');
    }
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

checkAdminUser();
