# ChatAdmin - StreamChat Admin Panel

Interface administrativa para gerenciar canais de chat e avisos do feed de atividades do StreamChat.

## 🎯 Stack Técnico

- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **TailwindCSS**
- **Docker** + Docker Compose
- **Nginx** (reverse proxy)
- **Stream Chat API**
- **Stream Activity Feeds API v3**

## 🚀 Como Rodar

### Desenvolvimento Local (Docker)

1. Copiar variáveis de ambiente:
```bash
cp .env.example .env
```

2. Iniciar containers:
```bash
docker-compose up -d
```

3. Acessar:
- **App:** http://localhost:3000
- **Via Nginx:** http://localhost

### Deploy na VM Azure

1. Copiar projeto para VM:
```bash
rsync -avz --exclude='node_modules' --exclude='.next' --exclude='.git' \
  ./ azureuser@20.61.121.203:~/chatadmin/
```

2. SSH na VM e iniciar:
```bash
ssh azureuser@20.61.121.203
cd ~/chatadmin
docker-compose up -d
```

3. Acessar:
- http://20.61.121.203:3000
- http://20.61.121.203 (via Nginx)

## 📋 Funcionalidades

### 💬 Gerenciamento de Canais
- Listar todos os canais
- Criar novos canais (1-on-1, grupos)
- Editar configurações do canal
- Adicionar/remover membros
- Deletar canais

### 📢 Curadoria de Avisos
- Listar avisos do feed
- Criar novos avisos com:
  - Editor de texto rico
  - Upload de imagens/vídeos
  - Seleção de tema (Cartões, Milhas, Network)
  - Definir importância (Normal, Urgente)
- Editar avisos existentes
- Deletar avisos
- Preview antes de publicar

## 🔧 Estrutura do Projeto

```
chatadmin/
├── app/                    # Pages (App Router)
│   ├── layout.tsx          # Layout principal
│   ├── page.tsx            # Home
│   ├── channels/           # Módulo de canais
│   └── announcements/      # Módulo de avisos
├── components/             # Componentes reutilizáveis
├── lib/                    # Clientes API e utils
│   ├── stream-chat.ts      # Cliente Stream Chat API
│   └── stream-feeds.ts     # Cliente Stream Feeds API
├── public/                 # Assets estáticos
├── Dockerfile              # Build da aplicação
├── docker-compose.yml      # Orquestração dos containers
├── nginx.conf              # Configuração do Nginx
└── .env.example            # Template de variáveis
```

## 🔐 Variáveis de Ambiente

```bash
# Stream Chat API
NEXT_PUBLIC_STREAM_API_KEY=gabuv8nu8azd
STREAM_SECRET=jf3qa9jg972vefjggakpt2vwcmbupkxghygbhz4ehfy3b254m9963wnzjgu8yd76

# Stream Feeds API
NEXT_PUBLIC_STREAM_FEEDS_API_KEY=gabuv8nu8azd
STREAM_FEEDS_SECRET=jf3qa9jg972vefjggakpt2vwcmbupkxghygbhz4ehfy3b254m9963wnzjgu8yd76

# Environment
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_APP_NAME=ChatAdmin
NEXT_PUBLIC_APP_VERSION=1.0.0
```

## 🐳 Comandos Docker

```bash
# Iniciar containers
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar containers
docker-compose down

# Rebuild após mudanças
docker-compose up -d --build

# Remover tudo (incluindo volumes)
docker-compose down -v
```

## 🎨 Componentes Customizados

### IconPicker
Componente exclusivo para seleção de ícones de canais com dupla funcionalidade:

**1. Biblioteca de Ícones** (18 ícones pré-selecionados do lucide-react):
- MessageSquare, Hash, Users, Megaphone, Bell, BookOpen
- Briefcase, Calendar, Camera, Coffee, Heart, Home
- Music, Settings, ShoppingCart, Star, Trophy, Zap

**2. Upload de Imagem**:
- Suporta JPG/PNG
- Validação automática de tipo de arquivo
- Redimensionamento inteligente para 256x256px
- Crop centralizado para manter aspect ratio quadrado
- Conversão para base64 para storage direto
- Preview em tempo real
- Interface com tabs para alternar entre modos

**Uso:**
```tsx
import { IconPicker } from "@/components/ui/icon-picker"

<IconPicker
  value={formData.image}
  onChange={(value) => setFormData({ ...formData, image: value })}
/>
```

## 📝 TODOs

### Funcionalidades Implementadas ✅
- [x] CRUD completo de canais (create, read, update, delete)
- [x] Gerenciamento de membros (adicionar/remover)
- [x] shadcn/ui components (Button, Card, Dialog, Table, Input, Label)
- [x] IconPicker customizado com upload e biblioteca
- [x] Design system com cores customizadas
- [x] Deploy em Docker + Azure VM

### Próximas Features
- [ ] Implementar CRUD de avisos (feed de atividades)
- [ ] Editor rico de conteúdo (Tiptap/Slate)
- [ ] Upload de mídia para avisos
- [ ] Sistema de filtros e busca
- [ ] Paginação na lista de canais
- [ ] Autenticação (quando for para produção)
- [ ] Logs de auditoria
- [ ] Testes automatizados (Jest + React Testing Library)
- [ ] CI/CD pipeline

## 📊 Status do Projeto

**Versão:** 1.0.0 (MVP - Canais Completo)
**Status:** ✅ Canais Funcionais | 🚧 Avisos em Desenvolvimento
**Ambiente:** Dev/Testes (VM Azure)
**Última Atualização:** 21 Novembro 2025
**URL Produção:** http://20.61.121.203:3000

## 🔗 Links

- **VM Azure:** 20.61.121.203
- **Stream Dashboard:** https://dashboard.getstream.io/
- **API Key:** gabuv8nu8azd

---

**Desenvolvido por:** Euclides Gomes + Claude Code
