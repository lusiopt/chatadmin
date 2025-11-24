"use client"

import * as React from "react"
import api from "@/lib/api"
import {
  MessageSquare, Hash, Users, Megaphone, Bell, BookOpen,
  Briefcase, Calendar, Camera, Coffee, Heart, Home,
  Music, Settings, ShoppingCart, Star, Trophy, Zap,
  // Comunicação
  Phone, Mail, Send, MessageCircle, Video, Mic,
  // Negócios
  DollarSign, TrendingUp, BarChart, PieChart, Target, Award,
  // Atividades
  Gamepad, Plane, Map, Compass, Globe, Rocket,
  // Objetos
  Gift, Package, Tag, ShoppingBag, CreditCard, Wallet,
  // Ações
  Plus, Minus, Check, X, Edit, Trash2,
  // Outros
  Sun, Moon, Cloud, Umbrella, Flame, Droplet,
  Upload
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const AVAILABLE_ICONS = [
  // Comunicação
  { name: "MessageSquare", icon: MessageSquare, label: "Mensagem", category: "comunicação" },
  { name: "MessageCircle", icon: MessageCircle, label: "Chat", category: "comunicação" },
  { name: "Phone", icon: Phone, label: "Telefone", category: "comunicação" },
  { name: "Mail", icon: Mail, label: "Email", category: "comunicação" },
  { name: "Send", icon: Send, label: "Enviar", category: "comunicação" },
  { name: "Video", icon: Video, label: "Vídeo", category: "comunicação" },
  { name: "Mic", icon: Mic, label: "Microfone", category: "comunicação" },
  { name: "Megaphone", icon: Megaphone, label: "Megafone", category: "comunicação" },
  { name: "Bell", icon: Bell, label: "Sino", category: "comunicação" },

  // Grupos & Pessoas
  { name: "Users", icon: Users, label: "Usuários", category: "grupos" },
  { name: "Hash", icon: Hash, label: "Hashtag", category: "grupos" },

  // Negócios
  { name: "Briefcase", icon: Briefcase, label: "Maleta", category: "negócios" },
  { name: "DollarSign", icon: DollarSign, label: "Dólar", category: "negócios" },
  { name: "TrendingUp", icon: TrendingUp, label: "Crescimento", category: "negócios" },
  { name: "BarChart", icon: BarChart, label: "Gráfico", category: "negócios" },
  { name: "PieChart", icon: PieChart, label: "Pizza", category: "negócios" },
  { name: "Target", icon: Target, label: "Alvo", category: "negócios" },
  { name: "Award", icon: Award, label: "Prêmio", category: "negócios" },
  { name: "Trophy", icon: Trophy, label: "Troféu", category: "negócios" },

  // Atividades
  { name: "Calendar", icon: Calendar, label: "Calendário", category: "atividades" },
  { name: "Gamepad", icon: Gamepad, label: "Jogo", category: "atividades" },
  { name: "Plane", icon: Plane, label: "Avião", category: "atividades" },
  { name: "Map", icon: Map, label: "Mapa", category: "atividades" },
  { name: "Compass", icon: Compass, label: "Bússola", category: "atividades" },
  { name: "Globe", icon: Globe, label: "Globo", category: "atividades" },
  { name: "Rocket", icon: Rocket, label: "Foguete", category: "atividades" },

  // Compras & Finanças
  { name: "ShoppingCart", icon: ShoppingCart, label: "Carrinho", category: "compras" },
  { name: "ShoppingBag", icon: ShoppingBag, label: "Sacola", category: "compras" },
  { name: "Gift", icon: Gift, label: "Presente", category: "compras" },
  { name: "Package", icon: Package, label: "Pacote", category: "compras" },
  { name: "Tag", icon: Tag, label: "Etiqueta", category: "compras" },
  { name: "CreditCard", icon: CreditCard, label: "Cartão", category: "compras" },
  { name: "Wallet", icon: Wallet, label: "Carteira", category: "compras" },

  // Outros
  { name: "BookOpen", icon: BookOpen, label: "Livro", category: "outros" },
  { name: "Camera", icon: Camera, label: "Câmera", category: "outros" },
  { name: "Coffee", icon: Coffee, label: "Café", category: "outros" },
  { name: "Heart", icon: Heart, label: "Coração", category: "outros" },
  { name: "Home", icon: Home, label: "Casa", category: "outros" },
  { name: "Music", icon: Music, label: "Música", category: "outros" },
  { name: "Settings", icon: Settings, label: "Configurações", category: "outros" },
  { name: "Star", icon: Star, label: "Estrela", category: "outros" },
  { name: "Zap", icon: Zap, label: "Raio", category: "outros" },
  { name: "Sun", icon: Sun, label: "Sol", category: "outros" },
  { name: "Moon", icon: Moon, label: "Lua", category: "outros" },
  { name: "Cloud", icon: Cloud, label: "Nuvem", category: "outros" },
  { name: "Umbrella", icon: Umbrella, label: "Guarda-chuva", category: "outros" },
  { name: "Flame", icon: Flame, label: "Fogo", category: "outros" },
  { name: "Droplet", icon: Droplet, label: "Gota", category: "outros" },
]

interface IconPickerProps {
  value?: string
  onChange: (value: string) => void
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [mode, setMode] = React.useState<"icon" | "upload">("icon")
  const [uploading, setUploading] = React.useState(false)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const [imageError, setImageError] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const selectedIcon = AVAILABLE_ICONS.find(icon => icon.name === value)
  const SelectedIconComponent = selectedIcon?.icon

  // Detecta se o value é uma URL de imagem
  const isImageUrl = value && (value.startsWith('http') || value.startsWith('data:'))

  // Reset error quando value mudar
  React.useEffect(() => {
    setImageError(false)
  }, [value])

  // Converter nome do ícone para URL do SVG estático
  const iconNameToUrl = (iconName: string): string => {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ""
    // Converter PascalCase para kebab-case (MessageSquare -> message-square)
    const kebabName = iconName.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()
    return `https://dev.lusio.market${basePath}/icons/${kebabName}.png`
  }

  const handleIconSelect = (iconName: string) => {
    // Converter nome do ícone para URL completa do SVG estático
    const iconUrl = iconNameToUrl(iconName)
    onChange(iconUrl)
    setIsOpen(false)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    if (!file.type.match(/^image\/(jpeg|jpg|png|webp|gif)$/)) {
      alert("Por favor, selecione apenas arquivos de imagem (JPG, PNG, WebP ou GIF)")
      return
    }

    // Criar preview local
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // TODO: Migrar para Supabase Storage em produção
    // Fazer upload para storage local (temporário)
    try {
      setUploading(true)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'channel-icon')

      const { data } = await api.post('/api/upload/local', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      // Salvar a URL retornada
      onChange(data.url)
      setIsOpen(false)
      setPreviewUrl(null)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao fazer upload da imagem')
      setPreviewUrl(null)
    } finally {
      setUploading(false)
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <div className="space-y-2">
        <Label>Ícone do Canal</Label>

        <div className="flex gap-2">
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start"
            >
              <div className="flex items-center gap-2">
                {isImageUrl && !imageError ? (
                  <img
                    src={value}
                    alt="Ícone do canal"
                    className="w-6 h-6 rounded-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : imageError ? (
                  <Camera className="w-6 h-6 text-muted-foreground" />
                ) : SelectedIconComponent ? (
                  <SelectedIconComponent className="w-6 h-6" />
                ) : (
                  <MessageSquare className="w-6 h-6 text-muted-foreground" />
                )}
                <span>
                  {isImageUrl && !imageError
                    ? 'Imagem customizada'
                    : imageError
                    ? 'Imagem inválida - escolha outra'
                    : selectedIcon?.label || 'Selecionar ícone'}
                </span>
              </div>
            </Button>
          </DialogTrigger>

          {value && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => {
                onChange("")
                setPreviewUrl(null)
              }}
            >
              ✕
            </Button>
          )}
        </div>
      </div>

      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Escolher Ícone</DialogTitle>
          <DialogDescription>
            Selecione um ícone da biblioteca ou faça upload de uma imagem
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex gap-2 border-b">
            <button
              className={cn(
                "px-4 py-2 font-medium transition-colors",
                mode === "icon"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setMode("icon")}
            >
              Biblioteca de Ícones ({AVAILABLE_ICONS.length})
            </button>
            <button
              className={cn(
                "px-4 py-2 font-medium transition-colors",
                mode === "upload"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setMode("upload")}
            >
              Upload de Imagem
            </button>
          </div>

          {/* Conteúdo */}
          {mode === "icon" ? (
            <div className="grid grid-cols-8 gap-2 max-h-96 overflow-y-auto py-2">
              {AVAILABLE_ICONS.map((icon) => {
                const IconComponent = icon.icon
                const isSelected = value === icon.name
                return (
                  <button
                    key={icon.name}
                    type="button"
                    className={cn(
                      "relative flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all hover:bg-accent",
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-transparent hover:border-border"
                    )}
                    onClick={() => handleIconSelect(icon.name)}
                    title={icon.label}
                  >
                    <IconComponent className="w-6 h-6" />
                    <span className="text-[10px] text-center line-clamp-1">{icon.label}</span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-primary absolute top-1 right-1" />
                    )}
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={uploading}
                />

                {previewUrl || (value && isImageUrl) ? (
                  <div className="space-y-4">
                    {/* Preview Circular - igual ao iOS */}
                    <div className="flex justify-center">
                      <div className="relative w-32 h-32">
                        <img
                          src={previewUrl || value}
                          alt="Preview"
                          className="w-full h-full rounded-full object-cover border-4 border-primary/20"
                        />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Preview de como vai aparecer no app iOS
                    </p>
                    {!uploading && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleUploadClick}
                        disabled={uploading}
                      >
                        Escolher outra imagem
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium mb-1">
                        Clique para fazer upload
                      </p>
                      <p className="text-xs text-muted-foreground">
                        JPG, PNG, WebP ou GIF (até 100MB)
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        A imagem será cortada em formato circular no app
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={handleUploadClick}
                      disabled={uploading}
                    >
                      {uploading ? 'Fazendo upload...' : 'Selecionar Imagem'}
                    </Button>
                  </div>
                )}
              </div>

              {uploading && (
                <div className="text-center text-sm text-muted-foreground">
                  Fazendo upload para Stream CDN...
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
