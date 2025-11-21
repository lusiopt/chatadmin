# ChatAdmin - Projeto 100% na VM Azure

⚠️ **ATENÇÃO**: Este repositório local contém APENAS documentação.
Todo o código está rodando na **VM Azure** em `20.61.121.203`.

## 🚀 Acesso Rápido

### SSH na VM
```bash
ssh azureuser@20.61.121.203
cd ~/chatadmin
```

**Credenciais:** Salvas em `~/Claude/docs/infrastructure/CREDENTIALS.md`

### URLs do Projeto

**Produção:**
- https://dev.lusio.market/chat

**API (desenvolvimento):**
- https://dev.lusio.market/chat/api/channels
- https://dev.lusio.market/chat/api/users

## 📁 Estrutura na VM

```
~/chatadmin/
├── app/              # Rotas Next.js (App Router)
├── components/       # Componentes React
├── lib/             # Funções utilitárias (Stream Chat SDK)
├── public/          # Arquivos estáticos
│   └── uploads/     # Uploads de imagens (persistente via volume Docker)
├── .env             # Variáveis de ambiente (NUNCA commitar!)
├── docker-compose.yml
├── Dockerfile
└── nginx.conf
```

## 🛠️ Comandos Úteis

### Ver logs da aplicação
```bash
ssh azureuser@20.61.121.203 "cd ~/chatadmin && sudo docker-compose logs -f --tail=50"
```

### Rebuild da aplicação
```bash
ssh azureuser@20.61.121.203 "cd ~/chatadmin && sudo docker-compose down && sudo docker-compose up -d --build"
```

### Status dos containers
```bash
ssh azureuser@20.61.121.203 "sudo docker ps"
```

### Entrar no container
```bash
ssh azureuser@20.61.121.203 "sudo docker exec -it chatadmin sh"
```

## 💻 Workflow de Desenvolvimento

### Opção 1: VS Code Remote SSH (Recomendado)
1. Instalar extensão "Remote - SSH" no VS Code
2. Adicionar host: `azureuser@20.61.121.203`
3. Abrir pasta: `~/chatadmin`
4. Desenvolver diretamente na VM

### Opção 2: Terminal SSH
```bash
ssh azureuser@20.61.121.203
cd ~/chatadmin
# Editar arquivos com vim/nano
# Rebuild: sudo docker-compose up -d --build
```

### Opção 3: SSHFS (montar pasta da VM localmente)
```bash
# macOS
brew install macfuse sshfs
mkdir ~/mnt/chatadmin
sshfs azureuser@20.61.121.203:/home/azureuser/chatadmin ~/mnt/chatadmin
```

## 📝 Informações Técnicas

### Stack
- **Framework**: Next.js 15.5.6 (App Router)
- **Runtime**: Node.js (via Docker)
- **Chat SDK**: Stream Chat (server-side)
- **Database**: Supabase PostgreSQL
- **Deploy**: Docker + nginx reverse proxy

### Portas
- **Container**: 3000 (interno)
- **Nginx**: Proxy reverso em `/chat`
- **HTTPS**: Let's Encrypt via nginx na VM

### Git
- **Branch principal**: `main`
- **Repositório**: https://github.com/lusiopt/chatadmin

### Variáveis de Ambiente (.env na VM)
```bash
NEXT_PUBLIC_STREAM_API_KEY=ufnpjh6bbg4q
STREAM_SECRET=d2qhk7xhsnkg43xw2r4ezknkzs5vfyaxuapvzkuhkcqaemchzbshx2bskb22pknx
DATABASE_URL=postgresql://postgres.fikvjaduyseaukbtnqvw:...
NEXT_PUBLIC_BASE_PATH=/chat
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_APP_NAME=ChatAdmin
NEXT_PUBLIC_APP_VERSION=1.0.0
```

## 🔄 Deploy

### Fazer deploy após mudanças
```bash
# 1. SSH na VM
ssh azureuser@20.61.121.203

# 2. Ir para o projeto
cd ~/chatadmin

# 3. Pull das mudanças (se necessário)
git pull origin main

# 4. Rebuild
sudo docker-compose down
sudo docker-compose up -d --build

# 5. Verificar logs
sudo docker-compose logs -f
```

## 🐛 Troubleshooting

### Container não inicia
```bash
ssh azureuser@20.61.121.203 "cd ~/chatadmin && sudo docker-compose logs"
```

### Erro de API Key
Verificar se .env tem `NEXT_PUBLIC_STREAM_API_KEY` correto e fazer rebuild completo.

### Porta 3000 em uso
```bash
ssh azureuser@20.61.121.203 "sudo lsof -i :3000"
ssh azureuser@20.61.121.203 "sudo docker ps -a"
```

### Uploads não aparecem
Verificar permissões do volume:
```bash
ssh azureuser@20.61.121.203 "sudo ls -la ~/chatadmin/public/uploads/"
```

## 📚 Documentação Adicional

- **Infraestrutura Azure**: `~/Claude/docs/infrastructure/INFRAESTRUTURA.md`
- **Credenciais**: `~/Claude/docs/infrastructure/CREDENTIALS.md`
- **Stream Chat**: https://getstream.io/chat/docs/
- **Next.js**: https://nextjs.org/docs

---

**Última atualização**: 21 Novembro 2025
**Mantido por**: Euclides Gomes + Claude Code
