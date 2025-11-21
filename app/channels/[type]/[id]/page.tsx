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
import { Checkbox } from "@/components/ui/checkbox"
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

interface User {
  id: string
  name: string
  image?: string
  role?: string
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
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const [loadingUsers, setLoadingUsers] = useState(false)

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

  const loadAvailableUsers = async () => {
    try {
      setLoadingUsers(true)
      const response = await fetch('/api/users')

      if (response.ok) {
        const data = await response.json()
        // Filtrar usuários que já são membros
        const memberIds = new Set(members.map(m => m.user_id))
        const usersNotInChannel = data.users.filter((u: User) => !memberIds.has(u.id))
        setAvailableUsers(usersNotInChannel)
      }
    } catch (err) {
      console.error("Erro ao carregar usuários:", err)
    } finally {
      setLoadingUsers(false)
    }
  }

  // Carregar usuários quando o modal abrir
  useEffect(() => {
    if (isAddMemberDialogOpen) {
      loadAvailableUsers()
      setSelectedUserIds(new Set())
      setSearchQuery("")
    }
  }, [isAddMemberDialogOpen, members])

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUserIds)
    if (newSelection.has(userId)) {
      newSelection.delete(userId)
    } else {
      newSelection.add(userId)
    }
    setSelectedUserIds(newSelection)
  }

  const toggleSelectAll = () => {
    const filteredUsers = getFilteredUsers()
    if (selectedUserIds.size === filteredUsers.length) {
      setSelectedUserIds(new Set())
    } else {
      setSelectedUserIds(new Set(filteredUsers.map(u => u.id)))
    }
  }

  const getFilteredUsers = () => {
    if (!searchQuery.trim()) return availableUsers

    const query = searchQuery.toLowerCase()
    return availableUsers.filter(user =>
      user.id.toLowerCase().includes(query) ||
      user.name.toLowerCase().includes(query)
    )
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
    if (selectedUserIds.size === 0) {
      alert("Selecione pelo menos um usuário")
      return
    }

    try {
      const response = await fetch(`/api/channels/${type}/${id}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_ids: Array.from(selectedUserIds) }),
      })

      if (!response.ok) {
        throw new Error("Erro ao adicionar membros")
      }

      await loadMembers()
      setSelectedUserIds(new Set())
      setIsAddMemberDialogOpen(false)
      alert(`${selectedUserIds.size} membro(s) adicionado(s) com sucesso!`)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao adicionar membros")
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
                <DialogContent className="max-w-2xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>Adicionar Membros</DialogTitle>
                    <DialogDescription>
                      Selecione os usuários que deseja adicionar ao canal
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    {/* Campo de busca */}
                    <div className="grid gap-2">
                      <Label htmlFor="search-users">Buscar Usuários</Label>
                      <Input
                        id="search-users"
                        placeholder="Buscar por ID ou nome..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>

                    {/* Lista de usuários com checkboxes */}
                    <div className="border rounded-lg">
                      <div className="border-b p-3 bg-muted/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="select-all"
                            checked={selectedUserIds.size > 0 && selectedUserIds.size === getFilteredUsers().length}
                            onCheckedChange={toggleSelectAll}
                          />
                          <Label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                            Selecionar todos ({selectedUserIds.size} selecionados)
                          </Label>
                        </div>
                      </div>

                      <div className="max-h-[400px] overflow-y-auto">
                        {loadingUsers ? (
                          <div className="p-8 text-center text-muted-foreground">
                            Carregando usuários...
                          </div>
                        ) : getFilteredUsers().length === 0 ? (
                          <div className="p-8 text-center text-muted-foreground">
                            {searchQuery ? "Nenhum usuário encontrado" : "Nenhum usuário disponível"}
                          </div>
                        ) : (
                          getFilteredUsers().map((user) => (
                            <div
                              key={user.id}
                              className="flex items-center gap-3 p-3 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer"
                              onClick={() => toggleUserSelection(user.id)}
                            >
                              <Checkbox
                                id={`user-${user.id}`}
                                checked={selectedUserIds.has(user.id)}
                                onCheckedChange={() => toggleUserSelection(user.id)}
                              />
                              <div className="flex-1">
                                <p className="font-medium">{user.name}</p>
                                <p className="text-sm text-muted-foreground font-mono">{user.id}</p>
                              </div>
                              {user.role && (
                                <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium">
                                  {user.role}
                                </span>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsAddMemberDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleAddMember}
                      disabled={selectedUserIds.size === 0}
                    >
                      Adicionar {selectedUserIds.size > 0 && `(${selectedUserIds.size})`}
                    </Button>
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
