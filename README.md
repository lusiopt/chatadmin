# ChatAdmin - StreamChat Admin Panel

Interface administrativa para gerenciar canais de chat, usuários e avisos do feed de atividades do StreamChat.

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

### 👥 Gerenciamento de Usuários (Em Desenvolvimento)
- Listar usuários cadastrados
- Criar/editar usuários
- Upload de avatares (Supabase Storage)
- Sistema de permissões por tema:
  - **Cartões**: Ver chat, enviar mensagens, moderar
  - **Milhas**: Ver chat, enviar mensagens, moderar
  - **Network**: Ver chat, enviar mensagens, moderar
- Sincronização automática com Stream Chat

### 📢 Curadoria de Avisos (Planejado)
- Listar avisos do feed
- Criar novos avisos
- Editar/deletar avisos
- Filtrar por tema

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
│   ├── stream-chat.ts      # Cliente Stream Chat API
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

### 🚧 Em Desenvolvimento
- [ ] CRUD de usuários (interface)
- [ ] Sistema de permissões por tema
- [ ] Sincronização Supabase ↔ Stream
- [ ] Migração de 58 ícones para Supabase Storage
- [ ] Upload de avatares via interface

### 📋 Planejado
- [ ] Autenticação via Supabase Auth
- [ ] CRUD de avisos (feed de atividades)
- [ ] Editor rico de conteúdo
- [ ] Filtros por tema
- [ ] Logs de auditoria (interface)
- [ ] Testes automatizados

## 📊 Status do Projeto

**Versão:** 2.0.0 (Integração Supabase)
**Status:** 🚧 Em Desenvolvimento Ativo
**Ambiente:** VM Azure (20.61.121.203)
**Última Atualização:** 24 Novembro 2025
**URLs:**
- Dev: http://20.61.121.203:3000
- Produção (futuro): https://chat.lusio.market

## 🔗 Links Importantes

- **VM Azure:** 20.61.121.203
- **Stream Dashboard:** https://dashboard.getstream.io/
- **Supabase Dashboard:** https://supabase.com/dashboard/project/admiywnhpbezcgtnebvw
- **GitHub Repo:** https://github.com/lusiopt/chatadmin

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

**Desenvolvido por:** Euclides Gomes + Claude Code
**Workflow:** Local (Mac) → GitHub → VM Azure (PM2)
