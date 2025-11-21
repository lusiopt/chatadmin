"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
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
import { IconPicker } from "@/components/ui/icon-picker"

interface Channel {
  id: string
  type: string
  name?: string
  member_count?: number
  created_at?: string
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
  })

  // Carregar canais
  useEffect(() => {
    loadChannels()
  }, [])

  const loadChannels = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/channels")

      if (!response.ok) {
        throw new Error("Erro ao carregar canais")
      }

      const data = await response.json()
      setChannels(data.channels || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateChannel = async () => {
    try {
      const response = await fetch("/api/channels", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newChannel),
      })

      if (!response.ok) {
        throw new Error("Erro ao criar canal")
      }

      // Recarregar lista de canais
      await loadChannels()

      // Limpar formulário e fechar dialog
      setNewChannel({ id: "", name: "", type: "messaging", image: "" })
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
      const response = await fetch(`/api/channels/${type}/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Erro ao deletar canal")
      }

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

        {/* Lista de Canais */}
        <Card>
          <CardHeader>
            <CardTitle>Todos os Canais</CardTitle>
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
