# ChatAdmin - StreamChat Admin Panel

Interface administrativa para gerenciar canais de chat, usuários e avisos do feed de atividades do StreamChat.

## 🔗 Ecossistema Stream Chat

Este projeto faz parte do ecossistema de chat:

```
┌──────────────┐         ┌──────────────┐
│  ChatAdmin   │ gerencia│  StreamChat  │
│   (Web)      │────────▶│    (iOS)     │
│  Next.js 15  │         │ Swift/SwiftUI│
└──────┬───────┘         └──────┬───────┘
       │                        │
       ▼                        ▼
┌─────────────────────────────────────────┐
│         APIs Compartilhadas              │
│  • Stream Chat (gabuv8nu8azd)           │
│  • Supabase (admiywnhpbezcgtnebvw)      │
└─────────────────────────────────────────┘
```

- **ChatAdmin** (este projeto) = Painel Web para administradores
- **[StreamChat](../StreamChat/README.md)** = App iOS para usuários finais

## 🎯 Stack Técnico

- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **TailwindCSS**
- **PM2** (Process Manager)
- **Nginx** (reverse proxy)
- **Stream Chat API**
- **Stream Activity Feeds API v3**
- **Supabase Cloud** (Auth, Storage, Database)

## 🔄 Workflow de Desenvolvimento

### Fluxo Padrão (Local → GitHub → VM)

```bash
# 1. Desenvolvimento Local (Mac)
cd ~/Claude/projects/experimental/chatadmin
# fazer alterações no código
npm run dev  # testar localmente (http://localhost:3000)

# 2. Commit e Push para GitHub
git add .
git commit -m "feat: descrição da mudança

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
git push origin main

# 3. Deploy na VM Azure
ssh azureuser@20.61.121.203
cd ~/chatadmin
git pull origin main
pm2 restart chatadmin
pm2 logs chatadmin --lines 20  # verificar se está ok
```

### Comandos Rápidos

```bash
# Status da aplicação
pm2 status

# Ver logs em tempo real
pm2 logs chatadmin --lines 50

# Reiniciar após mudanças
pm2 restart chatadmin

# Salvar configuração PM2
pm2 save
```

## 🚀 Configuração Inicial

### 1. Variáveis de Ambiente

Criar arquivo `.env` na VM:

```bash
# Stream Chat API
NEXT_PUBLIC_STREAM_API_KEY=gabuv8nu8azd
STREAM_SECRET=jf3qa9jg972vefjggakpt2vwcmbupkxghygbhz4ehfy3b254m9963wnzjgu8yd76

# Supabase Cloud
NEXT_PUBLIC_SUPABASE_URL=https://admiywnhpbezcgtnebvw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Environment
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_APP_NAME=ChatAdmin
NEXT_PUBLIC_APP_VERSION=2.0.0
```

### 2. Instalar Dependências

```bash
npm install
```

### 3. Iniciar com PM2

```bash
pm2 start ecosystem.config.js
pm2 save
```

## 📋 Funcionalidades

### 💬 Gerenciamento de Canais
- Listar todos os canais
- Criar novos canais (1-on-1, grupos)
- Editar configurações do canal
- Adicionar/remover membros
- Deletar canais
- Upload de ícones para canais (Supabase Storage)

### 👥 Gerenciamento de Usuários
- ✅ Listar usuários cadastrados
- ✅ Criar/editar/deletar usuários
- ✅ Upload de avatares (Supabase Storage)
- ✅ Sistema de permissões granulares por tema:
  - **Cartões**: Ver chat, enviar mensagens, moderar
  - **Milhas**: Ver chat, enviar mensagens, moderar
  - **Network**: Ver chat, enviar mensagens, moderar
- ✅ Sincronização automática Supabase ↔ Stream Chat

### 📢 Sistema de Avisos (Announcements)
- ✅ Interface de listagem e criação
- ✅ Upload de imagens para Stream CDN
- ✅ CRUD completo via API
- ✅ Integração com Stream Activity Feeds v3
- 🚧 Publicação automática no feed do iOS

## 🔧 Estrutura do Projeto

```
chatadmin/
├── app/                    # Pages (App Router)
│   ├── layout.tsx          # Layout principal
│   ├── page.tsx            # Home com 3 cards
│   ├── channels/           # Módulo de canais
│   ├── users/              # Módulo de usuários (em dev)
│   └── api/                # APIs backend
│       ├── channels/       # CRUD canais
│       ├── users/          # CRUD usuários
│       └── upload/         # Upload para Supabase
├── components/             # Componentes reutilizáveis
│   └── ui/                 # shadcn/ui components
├── lib/                    # Clientes API e utils
│   ├── api.ts              # Cliente Axios (baseURL: /chat)
│   ├── stream.ts           # SDK v3 Unificado (Chat + Feeds + Users + Upload)
│   ├── supabase.ts         # Cliente Supabase
│   ├── storage.ts          # Helpers Supabase Storage
│   └── user-sync.ts        # Sync Supabase ↔ Stream
├── supabase/               # Migrations e config
│   └── migrations/         # SQL migrations
├── public/                 # Assets estáticos
│   └── icons/              # 58 ícones PNG (iOS-compatível)
├── ecosystem.config.js     # Configuração PM2
└── .env.example            # Template de variáveis
```

## 🗄️ Arquitetura de Dados

### Supabase (PostgreSQL)

**Tabelas:**
- `users` - Cadastro de usuários
- `user_permissions` - Permissões por tema
- `audit_logs` - Logs de ações administrativas

**Storage Buckets:**
- `avatars` - Fotos de perfil (2MB max)
- `channel-icons` - Ícones de canais (1MB max)
- `icon-library` - Biblioteca de 58 ícones PNG (512KB max)

### Stream Chat

**Armazena:**
- Mensagens do chat
- Imagens enviadas em mensagens (CDN Stream)
- Metadados de canais (URLs de avatares/ícones apontam para Supabase)
- Membros de canais

### Fluxo de Dados

```
1. Usuário faz login → Supabase Auth
2. Busca permissões → Supabase DB (user_permissions)
3. Cria/atualiza usuário → Stream Chat (com metadados do Supabase)
4. Upload avatar/ícone → Supabase Storage → retorna URL
5. URL salva no Stream Chat → iOS/Android carregam imagem do Supabase
```

## 🎨 Sistema de Ícones PNG (iOS-Compatível)

### Problema Resolvido
Stream Chat SDK no iOS **não suporta SVG**. Solução: 58 ícones PNG pré-gerados (256x256px) hospedados no Supabase Storage.

### Biblioteca de Ícones
- **Localização Atual:** `public/icons/*.png` (migração para Supabase em andamento)
- **URLs Futuras:** `https://admiywnhpbezcgtnebvw.supabase.co/storage/v1/object/public/icon-library/{nome}.png`
- **Total:** 58 ícones (SVG + PNG = 116 arquivos)

**Categorias:** Comunicação, Negócios, Atividades, Compras, Social, Transporte, Natureza

### Como Funciona
```typescript
// 1. Upload para Supabase Storage
const { url } = await uploadChannelIcon(file);

// 2. Stream Chat recebe URL do Supabase
channel.update({ image: url });

// 3. iOS/Android carregam PNG do Supabase ✅
```

## 🔌 Arquitetura de SDKs

### Stream SDK v3 Unificado
```
Pacote: @stream-io/node-sdk v0.7.21
Arquivo: lib/stream.ts
Uso: Chat + Feeds + Users + Upload (TUDO unificado)
```

**📚 Documentação completa:** [`docs/STREAM-SDK-V3.md`](docs/STREAM-SDK-V3.md)
- ~300 métodos documentados
- Exemplos de uso para cada módulo
- Solução para Feed Groups (404)

**⚠️ IMPORTANTE:** O SDK v3 é diferente do SDK v2 (`getstream`). Não misturar!

### Funções Disponíveis (lib/stream.ts)

```typescript
// === CHAT (Canais e Membros) ===
listChannels(filters, sort, options)        // Lista canais
getChannel(type, id)                        // Busca canal
createChannel(params)                       // Cria canal
updateChannel(type, id, params)             // Atualiza canal
deleteChannel(type, id)                     // Deleta canal
addMembers(type, id, userIds)               // Adiciona membros
removeMembers(type, id, userIds)            // Remove membros
listMembers(type, id)                       // Lista membros

// === USERS (Usuários Stream) ===
upsertUser(userData)                        // Cria/atualiza usuário
deleteUser(userId, options)                 // Deleta usuário
queryUsers(filters, sort, options)          // Busca usuários
queryChannelsForUser(filters)               // Canais de um usuário

// === FEEDS (Avisos) ===
ensureFeedGroup(groupId)                    // Garante Feed Group existe
publishAnnouncement(temaSlugs, data)        // Publica aviso
removeAnnouncementFromFeeds(slugs, id)      // Remove aviso
listAnnouncementsFromFeed(slug, limit)      // Lista avisos

// === UPLOAD (Imagens CDN) ===
uploadImage(buffer, filename, contentType)  // Upload para Stream CDN
```

### Cliente Axios (lib/api.ts)

```typescript
// Configuração importante:
const api = axios.create({
  baseURL: typeof window !== 'undefined' ? '/chat' : '',
  // SEM Content-Type default! Axios detecta automaticamente:
  // - Objeto JS → application/json
  // - FormData → multipart/form-data (com boundary)
});
```

**⚠️ NUNCA adicionar `Content-Type` default no axios.** Quebra uploads de FormData.

---

## 🔐 Sistema de Permissões

### Multi-Tema
Usuários podem ter acesso a múltiplos temas simultaneamente com permissões diferentes:

```typescript
{
  user_id: "abc123",
  permissions: [
    { tema: "cartoes", can_view_chat: true, can_send_messages: true },
    { tema: "milhas", can_view_chat: true, can_send_messages: false },
    { tema: "network", can_view_chat: false }  // sem acesso
  ]
}
```

### Sincronização com Stream
```typescript
// Supabase → Stream
await streamClient.upsertUser({
  id: user.id,
  name: user.nome,
  image: avatarUrl,  // URL do Supabase Storage
  role: user.role,
  data: {
    temas_permitidos: ['cartoes', 'milhas']  // Do Supabase
  }
});
```

## 📝 TODOs

### ✅ Implementado
- [x] CRUD completo de canais
- [x] Gerenciamento de membros
- [x] IconPicker customizado
- [x] Sistema de 58 ícones PNG
- [x] Deploy com PM2
- [x] Integração Supabase Cloud
- [x] Migrations de tabelas e buckets
- [x] Helpers de storage (upload/delete)
- [x] CRUD completo de usuários
- [x] Sistema de permissões granulares por tema
- [x] Sincronização Supabase ↔ Stream Chat
- [x] Upload de avatares via interface

### 🚧 Em Desenvolvimento
- [ ] Publicação de avisos no Activity Feed do iOS
- [ ] Migração de 58 ícones para Supabase Storage

### 📋 Planejado
- [ ] Autenticação via Supabase Auth
- [ ] Editor rico de conteúdo
- [ ] Logs de auditoria (interface)
- [ ] Testes automatizados

## 📊 Status do Projeto

**Versão:** 2.3.0 (Migração SDK v3 Unificado)
**Status:** ✅ Em Desenvolvimento Ativo
**Ambiente:** VM Azure (20.61.121.203)
**Última Atualização:** 27 Novembro 2025
**URLs:**
- Dev: https://dev.lusio.market/chat
- Produção (futuro): https://chat.lusio.market

## ⚠️ Notas Técnicas Importantes

### basePath `/chat`
Este projeto usa `basePath: '/chat'` no next.config.ts. Isso significa:
- **Não usar `fetch('/api/...')`** - não funciona com basePath
- **Usar `api.get('/api/...')`** do `lib/api.ts` (axios configurado)

### Upload de Arquivos
No servidor Node.js, arquivos precisam ser convertidos:
```typescript
// File do browser → Buffer para Supabase
const arrayBuffer = await file.arrayBuffer();
const buffer = Buffer.from(arrayBuffer);
```

## 🔗 Links Importantes

- **VM Azure:** 20.61.121.203
- **Stream Dashboard:** https://dashboard.getstream.io/
- **Supabase Dashboard:** https://supabase.com/dashboard/project/admiywnhpbezcgtnebvw
- **GitHub Repo:** https://github.com/lusiopt/chatadmin

## 🗄️ Database Migrations

### Executar Migrations (Supabase CLI)

O projeto usa **Supabase CLI** para gerenciar migrations. O CLI está linkado ao projeto `admiywnhpbezcgtnebvw`.

```bash
# Verificar se está linkado
supabase projects list

# Executar migrations pendentes
supabase db push

# Ver migrations aplicadas
supabase migration list

# Ver diferenças (dry-run)
supabase db diff
```

### Criar Nova Migration

```bash
# 1. Criar arquivo SQL em supabase/migrations/
# Formato: YYYYMMDDHHMMSS_descricao.sql
touch supabase/migrations/20251126120000_minha_migration.sql

# 2. Escrever o SQL no arquivo

# 3. Executar
supabase db push
```

### Migrations Existentes

| Arquivo | Descrição |
|---------|-----------|
| `20251124174905_create_users_tables.sql` | Tabelas de usuários |
| `20251124175003_enable_rls_and_functions.sql` | RLS e funções |
| `20251124193923_create_storage_buckets.sql` | Buckets de storage |
| `20251125180000_create_temas_table.sql` | Tabela de temas |
| `20251125190000_create_announcements_table.sql` | Tabela de avisos |
| `20251126_create_importancias.sql` | Tabela de importâncias |
| `20251126_create_channel_temas.sql` | Relação canal↔temas |

### Notas Importantes

- **Nunca use psql direto** - Use sempre `supabase db push`
- **Tracking automático** - Supabase guarda quais migrations já rodaram
- **Idempotente** - Só executa migrations novas
- **Credenciais** - Ver `docs/infrastructure/CREDENTIALS.md`

---

## 🛠️ Troubleshooting

### Aplicação não inicia
```bash
# Ver logs detalhados
pm2 logs chatadmin --lines 100

# Verificar variáveis de ambiente
cat .env | grep -E '(STREAM|SUPABASE)'

# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
pm2 restart chatadmin
```

### Problemas com uploads
```bash
# Verificar buckets no Supabase Dashboard
# Storage → Buckets → Verificar se avatars, channel-icons, icon-library existem

# Testar API de upload
curl -X POST http://20.61.121.203:3000/api/upload/avatar \
  -F "file=@test.png"
```

### Git pull falha
```bash
# Se houver conflitos
git fetch origin
git reset --hard origin/main
pm2 restart chatadmin
```

---

## 📋 Changelog

### v2.3.0 (27 Nov 2025) - Migração SDK v3 Unificado
- ✅ Unificação de 2 SDKs em 1 (`stream-chat` + `@stream-io/node-sdk` → apenas `@stream-io/node-sdk`)
- ✅ Novo arquivo `lib/stream.ts` centraliza Chat, Feeds, Users e Upload
- ✅ Removido `stream-chat` v8.40.0 do projeto
- ✅ Removidos arquivos antigos: `lib/stream-chat.ts`, `lib/stream-feeds.ts`
- 🔧 Todas as APIs migradas para usar funções do novo SDK unificado

**Arquivos removidos:**
- `lib/stream-chat.ts`
- `lib/stream-feeds.ts`

**Arquivos criados:**
- `lib/stream.ts` - SDK v3 Unificado (~500 linhas)

**APIs migradas:**
- `app/api/channels/*` - Usando funções de `lib/stream.ts`
- `app/api/users/*` - Via `lib/user-sync.ts` atualizado
- `app/api/announcements/*` - Usando funções de `lib/stream.ts`
- `app/api/upload/image` - Usando `uploadImage` de `lib/stream.ts`

### v2.2.0 (25 Nov 2025) - Upload de Imagens para Avisos
- ✅ Upload de imagens funcionando (Stream CDN)
- ✅ Migração Stream Feeds SDK v2 → v3 (`@stream-io/node-sdk`)
- ✅ CRUD completo de avisos via API
- 🔧 Corrigido: axios Content-Type para FormData (removido default)
- 🔧 Corrigido: PM2 executando código antigo (cache)

**Arquivos principais modificados:**
- `lib/api.ts` - Removido Content-Type default
- `app/api/upload/image/route.ts` - Endpoint de upload
- `components/announcements/ImageUploader.tsx` - UI de upload

### v2.1.0 (24 Nov 2025) - CRUD Usuários + Sincronização
- ✅ Sistema de permissões granulares por tema
- ✅ CRUD completo de usuários
- ✅ Deleção sincronizada (Supabase + Stream)
- 🔧 Corrigido: Race condition no sync de avatar
- 🔧 Corrigido: Cache de imagens (60s + versioning)
- 🔧 Corrigido: next.config.ts remotePatterns para Supabase

### v1.0.0 (21 Nov 2025) - Release Inicial
- Interface de gerenciamento de canais
- Interface de gerenciamento de usuários
- Integração básica com Stream Chat API
- Integração com Supabase (Auth, DB, Storage)

---

**Desenvolvido por:** Euclides Gomes + Claude Code
**Workflow:** Local (Mac) → GitHub → VM Azure (PM2)
