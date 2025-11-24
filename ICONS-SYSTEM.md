# Sistema de Ícones PNG - ChatAdmin

Documentação da solução funcional para ícones compatíveis com iOS.

## 🎯 Problema Resolvido

**Situação:** Stream Chat SDK no iOS **não suporta formato SVG**
**Erro original:** `ImagePipeline.Error error 2` ao tentar carregar ícones SVG
**Solução:** Biblioteca de 58 ícones PNG pré-gerados (256x256px)

## 📦 Biblioteca de Ícones

### Localização
- **Pasta:** `~/chatadmin/public/icons/`
- **Formato:** SVG + PNG (116 arquivos total)
- **Dimensões PNG:** 256x256px
- **URL Base:** `https://dev.lusio.market/chat/icons/`

### Lista Completa (58 ícones)

```
award, bar-chart, bell, bike, book, bookmark, briefcase, bus,
calendar, camera, car, clipboard, cloud, coffee, compass,
credit-card, database, dollar-sign, droplet, file-text, flag,
gamepad, gift, globe, graduation-cap, headphones, heart, home,
mail, map, map-pin, message-square, moon, music, navigation,
package, phone, pie-chart, plane, rocket, settings, ship,
shopping-bag, shopping-cart, smile, star, sun, tag, target,
thumbs-up, train, trending-up, truck, umbrella, users, video,
wind, zap
```

## 🔧 Como Funciona

### 1. Download dos Ícones (Lucide CDN)

Script: `download-icons.sh`

```bash
#!/bin/bash
ICONS_DIR="./public/icons"
mkdir -p $ICONS_DIR

icons=(
  "message-square" "globe" "users" "phone" "mail" "bell"
  "calendar" "briefcase" "trending-up" "target" "award"
  # ... (58 total)
)

for icon in "${icons[@]}"; do
  curl -s "https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/${icon}.svg" \
    -o "${ICONS_DIR}/${icon}.svg"
  echo "✓ ${icon}.svg"
done
```

### 2. Conversão SVG → PNG

Script: `convert-svg-to-png.mjs`

```javascript
import { readdir, readFile } from "fs/promises"
import { join } from "path"
import sharp from "sharp"

const iconsDir = "./public/icons"
const files = await readdir(iconsDir)
const svgFiles = files.filter(f => f.endsWith(".svg"))

for (const file of svgFiles) {
  const pngFile = file.replace(".svg", ".png")
  const svgBuffer = await readFile(join(iconsDir, file))
  
  await sharp(svgBuffer)
    .resize(256, 256)
    .png()
    .toFile(join(iconsDir, pngFile))
  
  console.log(`✓ ${file} → ${pngFile}`)
}
```

### 3. IconPicker (components/ui/icon-picker.tsx)

**Função Principal:**

```typescript
const iconNameToUrl = (iconName: string): string => {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ""
  // Converte PascalCase → kebab-case
  // "MessageSquare" → "message-square"
  const kebabName = iconName
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .toLowerCase()
  
  return `https://dev.lusio.market${basePath}/icons/${kebabName}.png`
}

const handleIconSelect = (iconName: string) => {
  const iconUrl = iconNameToUrl(iconName)
  onChange(iconUrl)  // Salva URL completa
  setIsOpen(false)
}
```

**Antes vs Depois:**

| Antes | Depois |
|-------|--------|
| Salvava: `"Globe"` | Salvava: `"https://dev.lusio.market/chat/icons/globe.png"` |
| iOS: ❌ Erro ao carregar | iOS: ✅ Carrega corretamente |

### 4. Fluxo Completo

```
1. Usuário seleciona ícone "Globe" no IconPicker
   ↓
2. iconNameToUrl() converte para URL:
   "https://dev.lusio.market/chat/icons/globe.png"
   ↓
3. Stream Chat API recebe a URL no campo "image"
   ↓
4. iOS app faz download do PNG via AsyncImage
   ↓
5. Ícone renderizado corretamente ✅
```

## 🧪 Como Testar

### 1. Verificar arquivos gerados
```bash
cd ~/chatadmin
ls public/icons/*.png | wc -l
# Deve retornar: 58
```

### 2. Testar URLs
```bash
# Teste local (porta 3000)
curl -I http://localhost:3000/icons/globe.png

# Teste produção (nginx)
curl -I https://dev.lusio.market/chat/icons/globe.png

# Ambos devem retornar: 200 OK
```

### 3. Criar canal de teste
1. Acesse https://dev.lusio.market/chat
2. Crie novo canal
3. Selecione ícone "Globe"
4. Verifique no iOS app se o ícone aparece

## 📊 Estatísticas

- **Total de ícones:** 58
- **Formato SVG:** 58 arquivos (~2-5 KB cada)
- **Formato PNG:** 58 arquivos (~3-8 KB cada, 256x256px)
- **Espaço total:** ~350 KB
- **Compatibilidade:** iOS ✅ | Web ✅ | Android ✅

## 🛠️ Manutenção

### Adicionar novos ícones

1. Edite `download-icons.sh` e adicione o nome:
```bash
icons=(
  # ... ícones existentes
  "novo-icone"
)
```

2. Execute os scripts:
```bash
./download-icons.sh
node convert-svg-to-png.mjs
```

3. Adicione ao IconPicker (`components/ui/icon-picker.tsx`):
```typescript
const AVAILABLE_ICONS = [
  // ... ícones existentes
  { name: "NovoIcone", icon: NovoIcone, label: "Novo", category: "categoria" },
]
```

4. Importe no topo do arquivo:
```typescript
import { NovoIcone } from "lucide-react"
```

## ⚠️ Troubleshooting

### Ícone não aparece no iOS

**Sintoma:** Ícone carrega no web mas não no iOS
**Causa:** URL está apontando para SVG ao invés de PNG
**Solução:** Verificar se `iconNameToUrl()` está usando `.png`

### Ícone não encontrado (404)

**Sintoma:** Erro 404 ao acessar URL do ícone
**Causa:** Nome do arquivo não corresponde ao nome do ícone
**Solução:** Verificar conversão PascalCase → kebab-case

Exemplo:
- `ShoppingCart` → deve virar `shopping-cart.png`
- `MessageSquare` → deve virar `message-square.png`

### Build falha ao importar ícones

**Sintoma:** Erro de import no build
**Causa:** Ícone não existe no lucide-react
**Solução:** Remover do AVAILABLE_ICONS ou usar ícone alternativo

## 📝 Histórico

| Data | Versão | Mudança |
|------|--------|---------|
| 21 Nov 2025 | 1.0 | Migração Docker → PM2 |
| 22 Nov 2025 | 1.1 | Sistema de ícones PNG implementado |
| 22 Nov 2025 | 1.1.1 | Testado e funcional no iOS ✅ |

---

**Status Atual:** ✅ Funcional  
**Testado em:** iOS app (iPhone 17 Pro Simulator)  
**URL Produção:** https://dev.lusio.market/chat
