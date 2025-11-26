"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { IconPicker } from "@/components/ui/icon-picker"

interface Tema {
  id: string
  slug: string
  nome: string
  cor: string
}

interface Channel {
  id: string
  type: string
  name?: string
  member_count?: number
  created_at?: string
  temas?: Tema[]
}

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newChannel, setNewChannel] = useState({
    id: "",
    name: "",
    type: "messaging",
    image: "",
    tema_ids: [] as string[],
  })

  // Estados para temas
  const [allTemas, setAllTemas] = useState<Tema[]>([])
  const [filterTemaId, setFilterTemaId] = useState<string>("")

  // Carregar canais e temas
  useEffect(() => {
    loadChannels()
    loadTemas()
  }, [])

  // Recarregar canais quando filtro mudar
  useEffect(() => {
    loadChannels()
  }, [filterTemaId])

  const loadChannels = async () => {
    try {
      setLoading(true)
      const params = filterTemaId ? `?tema_id=${filterTemaId}` : ''
      const { data } = await api.get(`/api/channels${params}`)
      setChannels(data.channels || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setLoading(false)
    }
  }

  const loadTemas = async () => {
    try {
      const { data } = await api.get('/api/temas?ativo=true')
      setAllTemas(data.temas || [])
    } catch (err) {
      console.error("Erro ao carregar temas:", err)
    }
  }

  const toggleTemaSelection = (temaId: string) => {
    setNewChannel(prev => {
      const newTemaIds = prev.tema_ids.includes(temaId)
        ? prev.tema_ids.filter(id => id !== temaId)
        : [...prev.tema_ids, temaId]
      return { ...prev, tema_ids: newTemaIds }
    })
  }

  const handleCreateChannel = async () => {
    try {
      await api.post("/api/channels", newChannel)

      // Recarregar lista de canais
      await loadChannels()

      // Limpar formulário e fechar dialog
      setNewChannel({ id: "", name: "", type: "messaging", image: "", tema_ids: [] })
      setIsCreateDialogOpen(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao criar canal")
    }
  }

  const handleDeleteChannel = async (type: string, id: string) => {
    if (!confirm(`Tem certeza que deseja deletar o canal "${id}"?`)) {
      return
    }

    try {
      await api.delete(`/api/channels/${type}/${id}`)

      // Recarregar lista de canais
      await loadChannels()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao deletar canal")
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-BR")
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Canais</h1>
            <p className="text-muted-foreground">
              Gerencie os canais de chat disponíveis
            </p>
          </div>
          <div className="flex gap-4">
            <Link href="/">
              <Button variant="outline">Voltar</Button>
            </Link>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>Criar Canal</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Novo Canal</DialogTitle>
                  <DialogDescription>
                    Preencha os dados do novo canal
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="channel-id">ID do Canal</Label>
                    <Input
                      id="channel-id"
                      placeholder="ex: suporte-geral"
                      value={newChannel.id}
                      onChange={(e) =>
                        setNewChannel({ ...newChannel, id: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="channel-name">Nome</Label>
                    <Input
                      id="channel-name"
                      placeholder="ex: Suporte Geral"
                      value={newChannel.name}
                      onChange={(e) =>
                        setNewChannel({ ...newChannel, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="channel-type">Tipo</Label>
                    <select
                      id="channel-type"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                      value={newChannel.type}
                      onChange={(e) =>
                        setNewChannel({ ...newChannel, type: e.target.value })
                      }
                    >
                      <option value="messaging">Messaging</option>
                      <option value="team">Team</option>
                      <option value="livestream">Livestream</option>
                    </select>
                  </div>
                  <IconPicker
                    value={newChannel.image}
                    onChange={(value) =>
                      setNewChannel({ ...newChannel, image: value })
                    }
                  />

                  {/* Seleção de Temas */}
                  <div className="grid gap-2">
                    <Label>Temas (opcional)</Label>
                    <p className="text-xs text-muted-foreground">
                      Selecione os temas para filtrar quem pode ver o canal
                    </p>
                    <div className="border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                      {allTemas.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhum tema disponível</p>
                      ) : (
                        allTemas.map((tema) => (
                          <div
                            key={tema.id}
                            className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded"
                            onClick={() => toggleTemaSelection(tema.id)}
                          >
                            <Checkbox
                              id={`create-tema-${tema.id}`}
                              checked={newChannel.tema_ids.includes(tema.id)}
                              onCheckedChange={() => toggleTemaSelection(tema.id)}
                            />
                            <div
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor:
                                  tema.cor === 'blue' ? '#3b82f6' :
                                  tema.cor === 'green' ? '#22c55e' :
                                  tema.cor === 'purple' ? '#a855f7' :
                                  tema.cor === 'red' ? '#ef4444' :
                                  tema.cor === 'yellow' ? '#eab308' :
                                  tema.cor === 'orange' ? '#f97316' :
                                  tema.cor === 'pink' ? '#ec4899' :
                                  '#6b7280'
                              }}
                            />
                            <span className="text-sm">{tema.nome}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateChannel}>Criar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filtro por Tema */}
        <div className="mb-6 flex items-center gap-4">
          <Label htmlFor="filter-tema" className="text-sm font-medium whitespace-nowrap">
            Filtrar por tema:
          </Label>
          <select
            id="filter-tema"
            className="flex h-9 w-64 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            value={filterTemaId}
            onChange={(e) => setFilterTemaId(e.target.value)}
          >
            <option value="">Todos os canais</option>
            {allTemas.map((tema) => (
              <option key={tema.id} value={tema.id}>
                {tema.nome}
              </option>
            ))}
          </select>
          {filterTemaId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilterTemaId("")}
            >
              Limpar filtro
            </Button>
          )}
        </div>

        {/* Lista de Canais */}
        <Card>
          <CardHeader>
            <CardTitle>
              {filterTemaId
                ? `Canais do tema: ${allTemas.find(t => t.id === filterTemaId)?.nome}`
                : "Todos os Canais"}
            </CardTitle>
            <CardDescription>
              {channels.length} canal(is) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="text-center py-8 text-muted-foreground">
                Carregando canais...
              </div>
            )}

            {error && (
              <div className="text-center py-8 text-destructive">
                {error}
              </div>
            )}

            {!loading && !error && channels.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum canal encontrado
              </div>
            )}

            {!loading && !error && channels.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Temas</TableHead>
                    <TableHead>Membros</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {channels.map((channel) => (
                    <TableRow key={`${channel.type}-${channel.id}`}>
                      <TableCell className="font-mono text-sm">
                        {channel.id}
                      </TableCell>
                      <TableCell>{channel.name || "-"}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium">
                          {channel.type}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {channel.temas && channel.temas.length > 0 ? (
                            channel.temas.map((tema) => (
                              <span
                                key={tema.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                                style={{
                                  backgroundColor:
                                    tema.cor === 'blue' ? '#dbeafe' :
                                    tema.cor === 'green' ? '#dcfce7' :
                                    tema.cor === 'purple' ? '#f3e8ff' :
                                    tema.cor === 'red' ? '#fee2e2' :
                                    tema.cor === 'yellow' ? '#fef9c3' :
                                    tema.cor === 'orange' ? '#ffedd5' :
                                    tema.cor === 'pink' ? '#fce7f3' :
                                    '#f3f4f6',
                                  color:
                                    tema.cor === 'blue' ? '#1d4ed8' :
                                    tema.cor === 'green' ? '#15803d' :
                                    tema.cor === 'purple' ? '#7e22ce' :
                                    tema.cor === 'red' ? '#b91c1c' :
                                    tema.cor === 'yellow' ? '#a16207' :
                                    tema.cor === 'orange' ? '#c2410c' :
                                    tema.cor === 'pink' ? '#be185d' :
                                    '#374151'
                                }}
                              >
                                <span
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{
                                    backgroundColor:
                                      tema.cor === 'blue' ? '#3b82f6' :
                                      tema.cor === 'green' ? '#22c55e' :
                                      tema.cor === 'purple' ? '#a855f7' :
                                      tema.cor === 'red' ? '#ef4444' :
                                      tema.cor === 'yellow' ? '#eab308' :
                                      tema.cor === 'orange' ? '#f97316' :
                                      tema.cor === 'pink' ? '#ec4899' :
                                      '#6b7280'
                                  }}
                                />
                                {tema.nome}
                              </span>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{channel.member_count || 0}</TableCell>
                      <TableCell>{formatDate(channel.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/channels/${channel.type}/${channel.id}`}
                          >
                            <Button variant="outline" size="sm">
                              Editar
                            </Button>
                          </Link>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              handleDeleteChannel(channel.type, channel.id)
                            }
                          >
                            Deletar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
