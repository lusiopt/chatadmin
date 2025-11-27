"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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
    email?: string
    image?: string
  }
  role?: string
  created_at?: string
}

interface User {
  id: string
  nome: string
  email?: string
  avatar?: string
  role?: string
  stream_user_id?: string
}

interface Tema {
  id: string
  slug: string
  nome: string
  cor: string
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

  // Estados para sheet de detalhes do membro
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [isMemberSheetOpen, setIsMemberSheetOpen] = useState(false)

  // Estados para paginação de membros
  const [membersPage, setMembersPage] = useState(1)
  const [membersSearch, setMembersSearch] = useState("")
  const MEMBERS_PER_PAGE = 20

  const [formData, setFormData] = useState({
    name: "",
    image: "",
  })

  // Estados para temas
  const [channelTemas, setChannelTemas] = useState<Tema[]>([])
  const [allTemas, setAllTemas] = useState<Tema[]>([])
  const [selectedTemaIds, setSelectedTemaIds] = useState<Set<string>>(new Set())
  const [isTemasDialogOpen, setIsTemasDialogOpen] = useState(false)
  const [savingTemas, setSavingTemas] = useState(false)

  // Carregar detalhes do canal
  useEffect(() => {
    loadChannelDetails()
    loadMembers()
    loadChannelTemas()
    loadAllTemas()
  }, [type, id])

  const loadChannelDetails = async () => {
    try {
      setLoading(true)
      const { data } = await api.get(`/api/channels/${type}/${id}`)
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
      const { data } = await api.get(`/api/channels/${type}/${id}/members`)
      setMembers(data.members || [])
    } catch (err) {
      console.error("Erro ao carregar membros:", err)
    }
  }

  const loadChannelTemas = async () => {
    try {
      const { data } = await api.get(`/api/channels/${type}/${id}/temas`)
      setChannelTemas(data.temas || [])
    } catch (err) {
      console.error("Erro ao carregar temas do canal:", err)
    }
  }

  const loadAllTemas = async () => {
    try {
      const { data } = await api.get('/api/temas?ativo=true')
      setAllTemas(data.temas || [])
    } catch (err) {
      console.error("Erro ao carregar temas:", err)
    }
  }

  const handleSaveTemas = async () => {
    try {
      setSavingTemas(true)
      await api.put(`/api/channels/${type}/${id}/temas`, {
        tema_ids: Array.from(selectedTemaIds)
      })
      await loadChannelTemas()
      setIsTemasDialogOpen(false)
      alert("Temas atualizados com sucesso!")
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao atualizar temas")
    } finally {
      setSavingTemas(false)
    }
  }

  // Abrir dialog de temas
  useEffect(() => {
    if (isTemasDialogOpen) {
      // Pré-selecionar temas atuais
      setSelectedTemaIds(new Set(channelTemas.map(t => t.id)))
    }
  }, [isTemasDialogOpen, channelTemas])

  const toggleTemaSelection = (temaId: string) => {
    const newSelection = new Set(selectedTemaIds)
    if (newSelection.has(temaId)) {
      newSelection.delete(temaId)
    } else {
      newSelection.add(temaId)
    }
    setSelectedTemaIds(newSelection)
  }

  const loadAvailableUsers = async () => {
    try {
      setLoadingUsers(true)
      const { data } = await api.get('/api/users')
      // Filtrar usuários que já são membros (comparar com stream_user_id)
      const memberIds = new Set(members.map(m => m.user_id))
      const usersNotInChannel = data.users.filter((u: any) =>
        !memberIds.has(u.stream_user_id || u.id)
      )
      setAvailableUsers(usersNotInChannel)
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
      user.nome.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    )
  }

  // Filtrar e paginar membros
  const getFilteredMembers = () => {
    if (!membersSearch.trim()) return members

    const query = membersSearch.toLowerCase()
    return members.filter(member =>
      member.user_id.toLowerCase().includes(query) ||
      member.user?.name?.toLowerCase().includes(query) ||
      member.user?.id?.toLowerCase().includes(query)
    )
  }

  const getPaginatedMembers = () => {
    const filtered = getFilteredMembers()
    const start = (membersPage - 1) * MEMBERS_PER_PAGE
    return filtered.slice(start, start + MEMBERS_PER_PAGE)
  }

  const totalMembersPages = Math.ceil(getFilteredMembers().length / MEMBERS_PER_PAGE)

  const handleMemberClick = (member: Member) => {
    setSelectedMember(member)
    setIsMemberSheetOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSaving(true)
      await api.patch(`/api/channels/${type}/${id}`, formData)
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
      // Converter IDs do Supabase para stream_user_id
      const streamUserIds = availableUsers
        .filter(u => selectedUserIds.has(u.id))
        .map(u => u.stream_user_id || u.id)

      await api.post(`/api/channels/${type}/${id}/members`, {
        user_ids: streamUserIds
      })
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
      await api.delete(`/api/channels/${type}/${id}/members`, {
        data: { user_ids: [userId] }
      })
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

        {/* Temas do Canal */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Temas do Canal</CardTitle>
                <CardDescription>
                  Temas associados a este canal (determina quem pode ver)
                </CardDescription>
              </div>
              <Dialog
                open={isTemasDialogOpen}
                onOpenChange={setIsTemasDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">Gerenciar Temas</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Gerenciar Temas</DialogTitle>
                    <DialogDescription>
                      Selecione os temas para este canal
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    {allTemas.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        Nenhum tema disponível
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {allTemas.map((tema) => (
                          <div
                            key={tema.id}
                            className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                            onClick={() => toggleTemaSelection(tema.id)}
                          >
                            <Checkbox
                              id={`tema-${tema.id}`}
                              checked={selectedTemaIds.has(tema.id)}
                              onCheckedChange={() => toggleTemaSelection(tema.id)}
                            />
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
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
                            <div className="flex-1">
                              <p className="font-medium">{tema.nome}</p>
                              <p className="text-xs text-muted-foreground">{tema.slug}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsTemasDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSaveTemas}
                      disabled={savingTemas}
                    >
                      {savingTemas ? "Salvando..." : "Salvar"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {channelTemas.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <p>Nenhum tema associado</p>
                <p className="text-sm">Este canal não será visível para ninguém</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {channelTemas.map((tema) => (
                  <span
                    key={tema.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
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
                      className="w-2 h-2 rounded-full"
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
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Membros do Canal */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Membros do Canal</CardTitle>
                <CardDescription>
                  {members.length} membro(s) no canal
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Buscar membros..."
                  value={membersSearch}
                  onChange={(e) => {
                    setMembersSearch(e.target.value)
                    setMembersPage(1)
                  }}
                  className="w-48"
                />
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
                                {/* Avatar */}
                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                                  {user.avatar ? (
                                    <img
                                      src={user.avatar}
                                      alt={user.nome}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-lg font-medium text-muted-foreground">
                                      {user.nome.charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{user.nome}</p>
                                  <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                                </div>
                                {user.role && (
                                  <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium flex-shrink-0">
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
            </div>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum membro no canal
              </div>
            ) : getFilteredMembers().length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum membro encontrado para "{membersSearch}"
              </div>
            ) : (
              <>
                {/* Lista de membros em cards */}
                <div className="space-y-2">
                  {getPaginatedMembers().map((member) => (
                    <div
                      key={member.user_id}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => handleMemberClick(member)}
                    >
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {member.user?.image ? (
                          <img
                            src={member.user.image}
                            alt={member.user?.name || "Usuário"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-lg font-medium text-primary">
                            {(member.user?.name || member.user_id).charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {member.user?.name || member.user_id}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {member.user?.email || `ID: ${member.user_id.slice(0, 8)}...`}
                        </p>
                      </div>

                      {/* Role badge */}
                      <span className="hidden sm:inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium flex-shrink-0">
                        {member.role || "member"}
                      </span>

                      {/* Data (mobile hidden) */}
                      <span className="hidden md:block text-xs text-muted-foreground flex-shrink-0">
                        {formatDate(member.created_at).split(",")[0]}
                      </span>

                      {/* Remover */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveMember(member.user_id)
                        }}
                      >
                        Remover
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Paginação */}
                {totalMembersPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={membersPage === 1}
                      onClick={() => setMembersPage(p => p - 1)}
                    >
                      Anterior
                    </Button>
                    <span className="text-sm text-muted-foreground px-4">
                      Página {membersPage} de {totalMembersPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={membersPage === totalMembersPages}
                      onClick={() => setMembersPage(p => p + 1)}
                    >
                      Próxima
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Sheet de detalhes do membro */}
        <Sheet open={isMemberSheetOpen} onOpenChange={setIsMemberSheetOpen}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Detalhes do Membro</SheetTitle>
              <SheetDescription>
                Informações do usuário neste canal
              </SheetDescription>
            </SheetHeader>
            {selectedMember && (
              <div className="mt-6 space-y-6">
                {/* Avatar grande */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {selectedMember.user?.image ? (
                      <img
                        src={selectedMember.user.image}
                        alt={selectedMember.user?.name || "Usuário"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-medium text-primary">
                        {(selectedMember.user?.name || selectedMember.user_id).charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-lg">
                      {selectedMember.user?.name || "Usuário"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedMember.user?.email || selectedMember.user_id}
                    </p>
                  </div>
                </div>

                {/* Informações */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">Função no Canal</span>
                    <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium">
                      {selectedMember.role || "member"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">Adicionado em</span>
                    <span className="text-sm">{formatDate(selectedMember.created_at)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">Stream User ID</span>
                    <span className="text-xs font-mono truncate max-w-[180px]">
                      {selectedMember.user_id}
                    </span>
                  </div>
                </div>

                {/* Ações */}
                <div className="space-y-2 pt-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setIsMemberSheetOpen(false)
                      router.push(`/users`)
                    }}
                  >
                    Ver Lista de Usuários
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => {
                      handleRemoveMember(selectedMember.user_id)
                      setIsMemberSheetOpen(false)
                    }}
                  >
                    Remover do Canal
                  </Button>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
