# Stream SDK v3 - Referência Completa

> **Pacote:** `@stream-io/node-sdk` v0.7.21 (beta)
> **Arquitetura:** SDK Unificado (Chat + Feeds + Video + Moderation)
> **Documentação oficial:** https://getstream.io/chat/docs/node/

---

## Índice

1. [Inicialização](#inicialização)
2. [Common API](#common-api) (~90 métodos)
3. [Chat API](#chat-api) (~70 métodos)
4. [Feeds API](#feeds-api) (~85 métodos)
5. [Video API](#video-api) (~60 métodos)
6. [Moderation API](#moderation-api) (~20 métodos)
7. [Uso no ChatAdmin](#uso-no-chatadmin)

---

## Inicialização

```typescript
import { StreamClient } from '@stream-io/node-sdk';

const client = new StreamClient(apiKey, secret);

// Acesso aos módulos
client.chat       // ChatApi
client.feeds      // FeedsApi
client.video      // VideoApi
client.moderation // ModerationApi

// Métodos globais (CommonApi)
client.getApp()
client.updateApp()
client.queryUsers()
client.uploadImage()
// etc.
```

---

## Common API

Métodos globais disponíveis diretamente no `StreamClient`.

### App & Configuração

| Método | Descrição |
|--------|-----------|
| `getApp()` | Retorna configurações do app |
| `updateApp(request)` | Atualiza configurações globais |
| `checkPush(request)` | Verifica configuração de push |
| `checkSQS(request)` | Verifica configuração SQS |
| `checkSNS(request)` | Verifica configuração SNS |

### Usuários

| Método | Descrição |
|--------|-----------|
| `queryUsers(request)` | Busca usuários com filtros |
| `updateUsers(request)` | Cria ou atualiza usuários em batch |
| `updateUsersPartial(request)` | Atualização parcial de usuários |
| `deleteUsers(request)` | Remove usuários (soft/hard delete) |
| `deactivateUser(request)` | Desativa usuário |
| `reactivateUser(request)` | Reativa usuário |
| `restoreUsers(request)` | Restaura usuários deletados |
| `exportUser(request)` | Exporta dados do usuário (GDPR) |

### Upload de Arquivos

| Método | Descrição |
|--------|-----------|
| `uploadImage(request)` | Upload de imagem para CDN |
| `uploadFile(request)` | Upload de arquivo genérico |
| `deleteImage(request)` | Remove imagem do CDN |
| `deleteFile(request)` | Remove arquivo do CDN |

**Exemplo de upload:**
```typescript
const response = await client.uploadImage({
  file: fileObject,
  user: { id: 'admin' },
  upload_sizes: [
    { width: 1920, height: 1080, resize: 'scale', crop: 'center' }
  ]
});
// response.file = URL da imagem
```

### Polls (Enquetes)

| Método | Descrição |
|--------|-----------|
| `createPoll(request)` | Cria enquete |
| `getPoll(request)` | Obtém enquete por ID |
| `updatePoll(request)` | Atualiza enquete |
| `deletePoll(request)` | Remove enquete |
| `queryPolls(request)` | Busca enquetes |
| `castPollVote(request)` | Registra voto |
| `removePollVote(request)` | Remove voto |
| `queryPollVotes(request)` | Lista votos |
| `createPollOption(request)` | Adiciona opção |
| `updatePollOption(request)` | Atualiza opção |
| `deletePollOption(request)` | Remove opção |

### Permissões & Roles

| Método | Descrição |
|--------|-----------|
| `listPermissions()` | Lista permissões disponíveis |
| `getPermission(request)` | Obtém permissão específica |
| `listRoles()` | Lista roles |
| `createRole(request)` | Cria role customizada |
| `deleteRole(request)` | Remove role |

### Push Notifications

| Método | Descrição |
|--------|-----------|
| `listPushProviders()` | Lista provedores de push |
| `upsertPushProvider(request)` | Cria/atualiza provedor |
| `deletePushProvider(request)` | Remove provedor |
| `listDevices(request)` | Lista devices do usuário |
| `createDevice(request)` | Registra device |
| `deleteDevice(request)` | Remove device |

### Blocklists

| Método | Descrição |
|--------|-----------|
| `listBlockLists()` | Lista blocklists |
| `getBlockList(request)` | Obtém blocklist |
| `createBlockList(request)` | Cria blocklist |
| `updateBlockList(request)` | Atualiza blocklist |
| `deleteBlockList(request)` | Remove blocklist |

### Outros

| Método | Descrição |
|--------|-----------|
| `getRateLimits()` | Limites de rate limiting |
| `getTaskStatus(request)` | Status de task assíncrona |
| `createImportUrl()` | URL para importação em massa |
| `createImport(request)` | Inicia importação |
| `listImports(request)` | Lista importações |
| `getImport(request)` | Status de importação |

---

## Chat API

Acesso via `client.chat`.

### Channels

| Método | Descrição |
|--------|-----------|
| `getOrCreateChannel(request)` | **Idempotente** - cria ou obtém canal |
| `queryChannels(request)` | Busca canais com filtros |
| `updateChannel(request)` | Atualiza canal |
| `updateChannelPartial(request)` | Atualização parcial |
| `deleteChannel(request)` | Remove canal |
| `truncateChannel(request)` | Limpa mensagens do canal |
| `hideChannel(request)` | Esconde canal para usuário |
| `showChannel(request)` | Mostra canal escondido |
| `markRead(request)` | Marca como lido |
| `markUnread(request)` | Marca como não lido |

**Exemplo de criação de canal:**
```typescript
const response = await client.chat.getOrCreateChannel({
  type: 'messaging',
  id: 'channel-id',
  data: {
    name: 'Nome do Canal',
    members: ['user1', 'user2'],
    created_by_id: 'admin'
  }
});
```

### Channel Types

| Método | Descrição |
|--------|-----------|
| `listChannelTypes()` | Lista tipos de canal |
| `getChannelType(request)` | Obtém tipo específico |
| `createChannelType(request)` | Cria tipo customizado |
| `updateChannelType(request)` | Atualiza tipo |
| `deleteChannelType(request)` | Remove tipo |

### Messages

| Método | Descrição |
|--------|-----------|
| `sendMessage(request)` | Envia mensagem |
| `getMessage(request)` | Obtém mensagem por ID |
| `updateMessage(request)` | Atualiza mensagem |
| `updateMessagePartial(request)` | Atualização parcial |
| `deleteMessage(request)` | Remove mensagem |
| `searchMessages(request)` | Busca em mensagens |
| `translateMessage(request)` | Traduz mensagem |
| `runMessageAction(request)` | Executa action em mensagem |
| `commitMessage(request)` | Confirma mensagem pendente |

### Reactions

| Método | Descrição |
|--------|-----------|
| `sendReaction(request)` | Adiciona reação |
| `deleteReaction(request)` | Remove reação |
| `getReactions(request)` | Lista reações de mensagem |
| `queryReactions(request)` | Busca reações |

### Threads

| Método | Descrição |
|--------|-----------|
| `queryThreads(request)` | Lista threads |
| `getThread(request)` | Obtém thread específica |
| `updateThreadPartial(request)` | Atualiza thread |

### Members

| Método | Descrição |
|--------|-----------|
| `queryMembers(request)` | Lista membros do canal |
| `addMembers(request)` | Adiciona membros |
| `removeMembers(request)` | Remove membros |
| `updateMembers(request)` | Atualiza membros |
| `inviteMembers(request)` | Convida membros |
| `acceptInvite(request)` | Aceita convite |
| `rejectInvite(request)` | Rejeita convite |

### Commands

| Método | Descrição |
|--------|-----------|
| `listCommands()` | Lista comandos |
| `getCommand(request)` | Obtém comando |
| `createCommand(request)` | Cria comando customizado |
| `updateCommand(request)` | Atualiza comando |
| `deleteCommand(request)` | Remove comando |

### Exports

| Método | Descrição |
|--------|-----------|
| `exportChannels(request)` | Exporta canais (JSON) |
| `getExportStatus(request)` | Status da exportação |

---

## Feeds API

Acesso via `client.feeds`.

### Feed Groups (CRÍTICO!)

| Método | Descrição |
|--------|-----------|
| `listFeedGroups()` | Lista todos os feed groups |
| `getOrCreateFeedGroup(request)` | **CRÍTICO** - Cria feed group se não existir |

**IMPORTANTE:** Feed Groups devem existir antes de adicionar atividades!

```typescript
// Criar Feed Group programaticamente (idempotente)
await client.feeds.getOrCreateFeedGroup({ id: 'cartoes' });
await client.feeds.getOrCreateFeedGroup({ id: 'noticias' });
await client.feeds.getOrCreateFeedGroup({ id: 'saude' });

// Agora pode adicionar atividades
await client.feeds.addActivity({
  feeds: ['cartoes:global'],
  // ...
});
```

### Activities (Atividades)

| Método | Descrição |
|--------|-----------|
| `addActivity(request)` | Publica atividade em feeds |
| `queryActivities(request)` | Busca atividades |
| `updateActivity(request)` | Atualiza atividade |
| `updateActivitiesPartial(request)` | Atualização parcial em batch |
| `deleteActivity(request)` | Remove atividade |
| `getActivities(request)` | Obtém atividades por IDs |
| `followStats(request)` | Estatísticas de follow |

**Exemplo de publicação:**
```typescript
const response = await client.feeds.addActivity({
  type: 'announce',
  feeds: ['cartoes:global', 'noticias:global'],
  text: 'Conteúdo do aviso',
  id: 'announcement:uuid-aqui',
  user_id: 'admin',
  // Campos customizados permitidos
});
```

### Follows

| Método | Descrição |
|--------|-----------|
| `follow(request)` | Segue um feed |
| `unfollow(request)` | Para de seguir |
| `queryFollows(request)` | Lista follows |
| `followMany(request)` | Follow em batch |
| `unfollowMany(request)` | Unfollow em batch |

### Open Graph

| Método | Descrição |
|--------|-----------|
| `og(request)` | Extrai Open Graph de URL |

### Reactions (Feeds)

| Método | Descrição |
|--------|-----------|
| `addReaction(request)` | Adiciona reação |
| `deleteReaction(request)` | Remove reação |
| `queryReactions(request)` | Lista reações |
| `getReaction(request)` | Obtém reação específica |
| `updateReaction(request)` | Atualiza reação |

### Comments

| Método | Descrição |
|--------|-----------|
| `addComment(request)` | Adiciona comentário |
| `queryComments(request)` | Lista comentários |
| `updateComment(request)` | Atualiza comentário |
| `deleteComment(request)` | Remove comentário |

### Collections

| Método | Descrição |
|--------|-----------|
| `upsertCollection(request)` | Cria/atualiza item de coleção |
| `deleteCollection(request)` | Remove item |
| `getCollection(request)` | Obtém item |
| `queryCollections(request)` | Busca itens |

### Users (Feeds)

| Método | Descrição |
|--------|-----------|
| `upsertFeedUser(request)` | Cria/atualiza usuário de feeds |
| `getFeedUser(request)` | Obtém usuário |
| `deleteFeedUser(request)` | Remove usuário |

### Personalization

| Método | Descrição |
|--------|-----------|
| `enrichActivities(request)` | Enriquece atividades com dados extras |

---

## Video API

Acesso via `client.video`.

### Calls

| Método | Descrição |
|--------|-----------|
| `getOrCreateCall(request)` | **Idempotente** - cria ou obtém call |
| `getCall(request)` | Obtém call por ID |
| `queryCalls(request)` | Busca calls |
| `updateCall(request)` | Atualiza call |
| `deleteCall(request)` | Remove call |
| `endCall(request)` | Encerra call |
| `goLive(request)` | Inicia transmissão ao vivo |
| `stopLive(request)` | Para transmissão |
| `joinCall(request)` | Entra na call |

### Recording

| Método | Descrição |
|--------|-----------|
| `startRecording(request)` | Inicia gravação |
| `stopRecording(request)` | Para gravação |
| `listRecordings(request)` | Lista gravações |
| `deleteRecording(request)` | Remove gravação |

### Transcription

| Método | Descrição |
|--------|-----------|
| `startTranscription(request)` | Inicia transcrição |
| `stopTranscription(request)` | Para transcrição |
| `listTranscriptions(request)` | Lista transcrições |
| `deleteTranscription(request)` | Remove transcrição |

### Broadcasting (RTMP)

| Método | Descrição |
|--------|-----------|
| `startRTMPBroadcasts(request)` | Inicia broadcast RTMP |
| `stopRTMPBroadcast(request)` | Para broadcast |
| `stopAllRTMPBroadcasts(request)` | Para todos os broadcasts |
| `listRTMPBroadcasts(request)` | Lista broadcasts ativos |

### HLS

| Método | Descrição |
|--------|-----------|
| `startHLSBroadcasting(request)` | Inicia HLS streaming |
| `stopHLSBroadcasting(request)` | Para HLS streaming |

### Call Types

| Método | Descrição |
|--------|-----------|
| `listCallTypes()` | Lista tipos de call |
| `getCallType(request)` | Obtém tipo específico |
| `createCallType(request)` | Cria tipo customizado |
| `updateCallType(request)` | Atualiza tipo |
| `deleteCallType(request)` | Remove tipo |

### Members

| Método | Descrição |
|--------|-----------|
| `updateCallMembers(request)` | Atualiza membros da call |
| `blockUser(request)` | Bloqueia usuário na call |
| `unblockUser(request)` | Desbloqueia usuário |
| `muteUsers(request)` | Muta usuários |
| `pinCall(request)` | Fixa call |
| `unpinCall(request)` | Remove fixação |

### Permissions (Call)

| Método | Descrição |
|--------|-----------|
| `requestPermission(request)` | Solicita permissão |
| `updateUserPermissions(request)` | Atualiza permissões do usuário |

### External Storage

| Método | Descrição |
|--------|-----------|
| `listExternalStorages()` | Lista storages externos |
| `createExternalStorage(request)` | Cria storage |
| `getExternalStorage(request)` | Obtém storage |
| `updateExternalStorage(request)` | Atualiza storage |
| `deleteExternalStorage(request)` | Remove storage |
| `checkExternalStorage(request)` | Verifica configuração |

### SIP Trunking

| Método | Descrição |
|--------|-----------|
| `listSIPTrunk()` | Lista SIP trunks |
| `createSIPTrunk(request)` | Cria SIP trunk |
| `updateSIPTrunk(request)` | Atualiza SIP trunk |
| `deleteSIPTrunk(request)` | Remove SIP trunk |
| `listSIPInboundTrunk()` | Lista inbound trunks |
| `createSIPInboundTrunk(request)` | Cria inbound trunk |
| `listSIPOutboundTrunk()` | Lista outbound trunks |
| `createSIPOutboundTrunk(request)` | Cria outbound trunk |
| `startSIPCall(request)` | Inicia chamada SIP |

### Stats & Telemetry

| Método | Descrição |
|--------|-----------|
| `videoGetCallStats(request)` | Estatísticas da call |
| `sendVideoStats(request)` | Envia métricas |
| `videoReportCallStatEvent(request)` | Reporta evento |

---

## Moderation API

Acesso via `client.moderation`.

### Ban & Mute

| Método | Descrição |
|--------|-----------|
| `ban(request)` | Bane usuário |
| `unban(request)` | Remove ban |
| `queryBannedUsers(request)` | Lista usuários banidos |
| `mute(request)` | Muta usuário |
| `unmute(request)` | Remove mute |

### Flagging

| Método | Descrição |
|--------|-----------|
| `flag(request)` | Reporta conteúdo |
| `queryModerationFlags(request)` | Lista flags |
| `queryReviewQueue(request)` | Fila de revisão |
| `submitAction(request)` | Submete ação de moderação |

### Config

| Método | Descrição |
|--------|-----------|
| `getConfig(request)` | Obtém configuração |
| `upsertConfig(request)` | Cria/atualiza configuração |
| `deleteConfig(request)` | Remove configuração |

---

## Uso no ChatAdmin

### Arquivo Principal: `lib/stream-feeds.ts`

```typescript
import { StreamClient } from '@stream-io/node-sdk';

let client: StreamClient | null = null;

function getStreamClient(): StreamClient {
  if (!client) {
    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
    const secret = process.env.STREAM_SECRET;

    if (!apiKey || !secret) {
      throw new Error('Missing Stream credentials');
    }

    client = new StreamClient(apiKey, secret);
  }
  return client;
}
```

### Publicar Aviso (com criação automática de Feed Group)

```typescript
export async function publishAnnouncement(
  temaSlugs: string[],
  data: AnnouncementActivityData
): Promise<string[]> {
  const client = getStreamClient();

  // IMPORTANTE: Garantir que Feed Groups existem
  for (const slug of temaSlugs) {
    await client.feeds.getOrCreateFeedGroup({ id: slug });
  }

  const feeds = temaSlugs.map(slug => `${slug}:global`);

  const response = await client.feeds.addActivity({
    type: 'announce',
    feeds: feeds,
    text: data.content.substring(0, 200),
    id: `announcement:${data.id}`,
    user_id: 'admin',
    // Custom fields
  });

  return response.activity?.id ? [response.activity.id] : [];
}
```

### Upload de Imagem

```typescript
export async function uploadImage(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<{ file: string; thumbUrl?: string }> {
  const client = getStreamClient();

  const file = new File([buffer], filename, { type: contentType });

  const response = await client.uploadImage({
    file: file,
    user: { id: 'admin' },
    upload_sizes: [
      { width: 1920, height: 1080, resize: 'scale', crop: 'center' }
    ]
  });

  return {
    file: response.file || '',
    thumbUrl: (response as any).thumb_url,
  };
}
```

---

## Referências

- [Stream Chat Docs](https://getstream.io/chat/docs/node/)
- [Stream Activity Feeds](https://getstream.io/activity-feeds/docs/)
- [Stream Video](https://getstream.io/video/docs/)
- [SDK GitHub](https://github.com/GetStream/stream-node)

---

**Última atualização:** 26 Novembro 2025
**Versão do SDK:** 0.7.21 (beta)
