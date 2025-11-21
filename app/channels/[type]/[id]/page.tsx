"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { IconPicker } from "@/components/ui/icon-picker"

interface ChannelDetails {
  id: string
  type: string
  name?: string
  image?: string
  member_count?: number
  created_at?: string
  updated_at?: string
}

interface Member {
  user_id: string
  user?: {
    id: string
    name?: string
  }
  role?: string
  created_at?: string
}

export default function ChannelDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const type = params.type as string
  const id = params.id as string

  const [channel, setChannel] = useState<ChannelDetails | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false)
  const [newMemberId, setNewMemberId] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    image: "",
  })

  // Carregar detalhes do canal
  useEffect(() => {
    loadChannelDetails()
    loadMembers()
  }, [type, id])

  const loadChannelDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/channels/${type}/${id}`)

      if (!response.ok) {
        throw new Error("Erro ao carregar canal")
      }

      const data = await response.json()
      setChannel(data.channel)
      setFormData({
        name: data.channel.name || "",
        image: data.channel.image || "",
      })
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setLoading(false)
    }
  }

  const loadMembers = async () => {
    try {
      const response = await fetch(`/api/channels/${type}/${id}/members`)

      if (response.ok) {
        const data = await response.json()
        setMembers(data.members || [])
      }
    } catch (err) {
      console.error("Erro ao carregar membros:", err)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSaving(true)
      const response = await fetch(`/api/channels/${type}/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Erro ao atualizar canal")
      }

      alert("Canal atualizado com sucesso!")
      await loadChannelDetails()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao atualizar canal")
    } finally {
      setSaving(false)
    }
  }

  const handleAddMember = async () => {
    if (!newMemberId.trim()) {
      alert("Digite um ID de usuário válido")
      return
    }

    try {
      const response = await fetch(`/api/channels/${type}/${id}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_ids: [newMemberId] }),
      })

      if (!response.ok) {
        throw new Error("Erro ao adicionar membro")
      }

      await loadMembers()
      setNewMemberId("")
      setIsAddMemberDialogOpen(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao adicionar membro")
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!confirm(`Tem certeza que deseja remover o usuário "${userId}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/channels/${type}/${id}/members`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_ids: [userId] }),
      })

      if (!response.ok) {
        throw new Error("Erro ao remover membro")
      }

      await loadMembers()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao remover membro")
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return date.toLocaleString("pt-BR")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12 text-muted-foreground">
            Carregando canal...
          </div>
        </div>
      </div>
    )
  }

  if (error || !channel) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12 text-destructive">
            {error || "Canal não encontrado"}
          </div>
          <div className="text-center">
            <Link href="/channels">
              <Button variant="outline">Voltar para Canais</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Detalhes do Canal</h1>
            <p className="text-muted-foreground font-mono">{channel.id}</p>
          </div>
          <Link href="/channels">
            <Button variant="outline">Voltar</Button>
          </Link>
        </div>

        {/* Formulário de Edição */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Informações do Canal</CardTitle>
            <CardDescription>Edite os dados do canal</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="channel-id">ID do Canal</Label>
                <Input
                  id="channel-id"
                  value={channel.id}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="channel-type">Tipo</Label>
                <Input
                  id="channel-type"
                  value={channel.type}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="channel-name">Nome</Label>
                <Input
                  id="channel-name"
                  placeholder="Nome do canal"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <IconPicker
                value={formData.image}
                onChange={(value) =>
                  setFormData({ ...formData, image: value })
                }
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Criado em</Label>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(channel.created_at)}
                  </p>
                </div>
                <div>
                  <Label>Atualizado em</Label>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(channel.updated_at)}
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Membros do Canal */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Membros do Canal</CardTitle>
                <CardDescription>
                  {members.length} membro(s) no canal
                </CardDescription>
              </div>
              <Dialog
                open={isAddMemberDialogOpen}
                onOpenChange={setIsAddMemberDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button size="sm">Adicionar Membro</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Membro</DialogTitle>
                    <DialogDescription>
                      Digite o ID do usuário para adicionar ao canal
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="member-id">ID do Usuário</Label>
                      <Input
                        id="member-id"
                        placeholder="ex: user123"
                        value={newMemberId}
                        onChange={(e) => setNewMemberId(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsAddMemberDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleAddMember}>Adicionar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum membro no canal
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID do Usuário</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Adicionado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.user_id}>
                      <TableCell className="font-mono text-sm">
                        {member.user_id}
                      </TableCell>
                      <TableCell>{member.user?.name || "-"}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium">
                          {member.role || "member"}
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(member.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveMember(member.user_id)}
                        >
                          Remover
                        </Button>
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
