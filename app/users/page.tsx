'use client';

import { useState, useEffect } from 'react';
import { UserPlus, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UserList } from '@/components/users/UserList';
import { UserDialog, User } from '@/components/users/UserDialog';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Buscar usuários
  const fetchUsers = async (pageNum: number = 1) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/users?page=${pageNum}&limit=20`);
      const data = await response.json();

      if (response.ok) {
        setUsers(data.users);
        setPage(data.pagination.page);
        setTotalPages(data.pagination.pages);
      } else {
        console.error('Erro ao buscar usuários:', data.error);
        alert('Erro ao carregar usuários');
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      alert('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Criar novo usuário
  const handleCreate = async (userData: Partial<User>) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (response.ok) {
        alert('Usuário criado com sucesso!');
        fetchUsers(page);
      } else {
        alert(data.error || 'Erro ao criar usuário');
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw error;
    }
  };

  // Atualizar usuário existente
  const handleUpdate = async (userData: Partial<User>) => {
    if (!editingUser) return;

    try {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (response.ok) {
        alert('Usuário atualizado com sucesso!');
        fetchUsers(page);
      } else {
        alert(data.error || 'Erro ao atualizar usuário');
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw error;
    }
  };

  // Deletar usuário
  const handleDelete = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        alert('Usuário deletado com sucesso!');
        fetchUsers(page);
      } else {
        alert(data.error || 'Erro ao deletar usuário');
      }
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      alert('Erro ao deletar usuário');
    }
  };

  // Abrir dialog para edição
  const handleEdit = (user: User) => {
    setEditingUser(user);
    setDialogOpen(true);
  };

  // Abrir dialog para criar
  const handleOpenCreate = () => {
    setEditingUser(null);
    setDialogOpen(true);
  };

  // Fechar dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingUser(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Usuários</h1>
              <p className="text-gray-600">
                Gerencie usuários e suas permissões de acesso por tema
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => fetchUsers(page)}
                disabled={loading}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
              <Button onClick={handleOpenCreate}>
                <UserPlus className="w-4 h-4 mr-2" />
                Novo Usuário
              </Button>
            </div>
          </div>
        </div>

        {/* Lista de usuários */}
        <div className="bg-white rounded-lg shadow-sm">
          <UserList
            users={users}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <div className="text-sm text-gray-600">
                Página {page} de {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchUsers(page - 1)}
                  disabled={page === 1 || loading}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchUsers(page + 1)}
                  disabled={page === totalPages || loading}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialog de criação/edição */}
      <UserDialog
        open={dialogOpen}
        onOpenChange={handleCloseDialog}
        user={editingUser}
        onSave={editingUser ? handleUpdate : handleCreate}
      />
    </div>
  );
}
