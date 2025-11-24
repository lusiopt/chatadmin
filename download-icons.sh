#\!/bin/bash

# Lista de ícones
icons=(
  "message-square" "globe" "users" "phone" "mail" "bell" "calendar"
  "briefcase" "trending-up" "target" "award" "bar-chart" "dollar-sign"
  "pie-chart" "file-text" "clipboard" "database" "settings"
  "zap" "coffee" "music" "camera" "video" "headphones" "gamepad"
  "heart" "star" "bookmark" "flag" "book" "graduation-cap"
  "shopping-cart" "shopping-bag" "credit-card" "gift" "package" "tag"
  "truck" "home" "map-pin" "map" "navigation" "compass" "plane"
  "car" "bike" "train" "bus" "ship" "rocket" "smile" "thumbs-up"
  "umbrella" "sun" "moon" "cloud" "droplet" "wind"
)

ICONS_DIR=~/chatadmin/public/icons
mkdir -p "$ICONS_DIR"

echo "Baixando ${#icons[@]} ícones do Lucide CDN..."

for icon in "${icons[@]}"; do
  # Baixar SVG do CDN do Lucide
  curl -s "https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/${icon}.svg" \
    -o "/tmp/${icon}.svg"
  
  # Converter para PNG com ImageMagick (se disponível) ou salvar SVG mesmo
  if command -v convert &> /dev/null; then
    convert -background none -density 300 "/tmp/${icon}.svg" -resize 512x512 "${ICONS_DIR}/${icon}.png"
    echo "✓ ${icon}.png"
  else
    # Se não tiver ImageMagick, copiar SVG (Next.js suporta SVG também)
    cp "/tmp/${icon}.svg" "${ICONS_DIR}/${icon}.svg"
    echo "⚠️  ${icon}.svg (ImageMagick não disponível para converter para PNG)"
  fi
  
  rm "/tmp/${icon}.svg"
done

echo ""
echo "✓ Ícones salvos em: $ICONS_DIR"
ls -lh "$ICONS_DIR" | head -20
