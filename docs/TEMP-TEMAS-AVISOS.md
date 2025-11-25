# IMPLEMENTACAO: Sistema de Avisos com Temas Dinamicos

> **ARQUIVO TEMPORARIO** - Sera removido apos conclusao da implementacao
> **Criado em:** 25 Nov 2025
> **Status:** EM ANDAMENTO

---

## Progresso da Implementacao

### PASSO 0 - Backup
- [ ] Criar tag v1.2.0-pre e push para GitHub

### FASE 1 - Modulo de Temas (ChatAdmin)
- [ ] 1. Criar migration tabela `temas`
- [ ] 2. Rodar migration no Supabase
- [ ] 3. Criar API CRUD /api/temas
- [ ] 4. Criar pagina /temas com listagem
- [ ] 5. Criar TemaDialog (criar/editar)
- [ ] 6. Adicionar card "Temas" na home
- [ ] 7. Atualizar lib/supabase.ts (remover union type)
- [ ] 8. Atualizar PermissionGrid.tsx (fetch dinamico)
- [ ] 9. Atualizar componentes de Avisos (fetch dinamico)
- [ ] 10. Testar CRUD de temas

### FASE 2 - Backend Avisos (ChatAdmin)
- [ ] 1. npm install @stream-io/node-sdk
- [ ] 2. Criar lib/stream-feeds.ts
- [ ] 3. Criar app/api/announcements/route.ts
- [ ] 4. Criar app/api/announcements/[id]/route.ts
- [ ] 5. Conectar frontend existente ao backend
- [ ] 6. Testar criacao/listagem/delecao

### FASE 3 - iOS (FUTURO)
- [ ] Aguardar aprovacao para modificar

---

## Arquitetura dos 3 Pilares

```
+-----------------+         +-----------------+         +-----------------+
|   ChatAdmin     | ------> |  Stream Feeds   | <------ |    iOS App      |
|   (Criar/Edit)  |  POST   |   v3 (Storage)  |  READ   |  (Exibir)       |
+-----------------+         +-----------------+         +-----------------+
        |                                                       |
        +------------------+                    +----------------+
                           v                    v
                    +-----------------------------+
                    |          Supabase           |
                    |  * temas (NOVA - dinamico)  |
                    |  * user_permissions         |
                    |  * can_view_announcements   |
                    +-----------------------------+
```

---

## PROBLEMA CRITICO: Temas Hardcoded

Os temas estao **hardcoded em 5 lugares diferentes**:

| Arquivo | Codigo |
|---------|--------|
| `lib/supabase.ts` | `tema: 'cartoes' \| 'milhas' \| 'network'` |
| `components/users/PermissionGrid.tsx` | `const TEMAS = ['Cartoes', 'Milhas', 'Network']` |
| `app/announcements/page.tsx` | Select hardcoded |
| `components/announcements/AnnouncementDialog.tsx` | `const TEMAS = [...]` |
| `components/announcements/AnnouncementList.tsx` | `TEMA_COLORS` hardcoded |

**Solucao:** Criar tabela `temas` no Supabase e carregar dinamicamente.

---

## Credenciais Stream Feeds

```
API Key: gabuv8nu8azd
Secret: jf3qa9jg972vefjggakpt2vwcmbupkxghygbhz4ehfy3b254m9963wnzjgu8yd76
```

---

## SQL da Tabela `temas`

```sql
CREATE TABLE IF NOT EXISTS public.temas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(50) UNIQUE NOT NULL,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    cor VARCHAR(50) DEFAULT 'gray',
    icone VARCHAR(50),
    ativo BOOLEAN DEFAULT true,
    ordem INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO temas (slug, nome, descricao, cor, ordem) VALUES
  ('cartoes', 'Cartoes', 'Cartoes de credito e beneficios', 'blue', 1),
  ('milhas', 'Milhas', 'Programa de milhas e pontos', 'green', 2),
  ('network', 'Network', 'Networking e comunidade', 'purple', 3);

CREATE INDEX idx_temas_ativo ON temas(ativo);
CREATE INDEX idx_temas_ordem ON temas(ordem);
```

---

## Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `supabase/migrations/[timestamp]_create_temas_table.sql` | Tabela de temas |
| `app/api/temas/route.ts` | GET/POST temas |
| `app/api/temas/[id]/route.ts` | GET/PATCH/DELETE tema |
| `app/temas/page.tsx` | Pagina de listagem de temas |
| `components/temas/TemaDialog.tsx` | Dialog criar/editar tema |
| `lib/stream-feeds.ts` | Cliente Stream Feeds v3 |
| `app/api/announcements/route.ts` | GET/POST avisos |
| `app/api/announcements/[id]/route.ts` | DELETE avisos |

## Arquivos a Modificar

| Arquivo | Mudanca |
|---------|---------|
| `app/page.tsx` | Adicionar card "Temas", grid 4 colunas |
| `lib/supabase.ts` | `tema: string` (nao union) |
| `components/users/PermissionGrid.tsx` | Fetch `/api/temas` |
| `app/announcements/page.tsx` | Fetch `/api/temas` |
| `components/announcements/AnnouncementDialog.tsx` | Fetch `/api/temas` |
| `components/announcements/AnnouncementList.tsx` | Usar `tema.cor` |

---

## Estrutura da Activity (Stream Feeds)

```json
{
  "actor": "admin",
  "verb": "announce",
  "object": "announcement:1732550000000",
  "foreign_id": "announcement:1732550000000",
  "custom": {
    "title": "Titulo do aviso",
    "message": "Resumo curto",
    "tema": "cartoes",
    "temaSlug": "cartoes",
    "temaNome": "Cartoes",
    "importancia": "Normal",
    "fullContent": "Conteudo completo (markdown)",
    "imageURLs": ["https://..."],
    "videoURLs": ["https://..."],
    "links": [{"url": "...", "title": "...", "description": "...", "imageURL": "..."}]
  }
}
```

---

## Dependencias

```bash
npm install @stream-io/node-sdk
```

---

## Notas de Sessao

> Adicionar notas aqui durante a implementacao para continuidade entre sessoes

### Sessao 1 (25 Nov 2025)
- Plano criado e aprovado
- Arquivo temporario criado
- Proximos: criar tag e iniciar Fase 1
