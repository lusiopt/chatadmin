'use client';

import { useState } from 'react';
import Image from 'next/image';
import { User, Edit, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { User as UserType } from './UserDialog';

interface UserListProps {
  users: UserType[];
  loading: boolean;
  onEdit: (user: UserType) => void;
  onDelete: (userId: string) => void;
}

export function UserList({ users, loading, onEdit, onDelete }: UserListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`Tem certeza que deseja deletar o usuário ${userName}?`)) {
      return;
    }

    setDeletingId(userId);
    try {
      await onDelete(userId);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Carregando usuários...</div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <User className="w-12 h-12 mb-2 text-gray-400" />
        <p>Nenhum usuário cadastrado</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Avatar</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Temas</TableHead>
            <TableHead className="w-[100px] text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const temas = user.user_permissions?.map((p) => p.tema) || [];

            return (
              <TableRow key={user.id}>
                {/* Avatar */}
                <TableCell>
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                    {user.avatar ? (
                      <Image
                        src={user.avatar}
                        alt={user.nome}
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                </TableCell>

                {/* Nome */}
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span>{user.nome}</span>
                    <span className="text-xs text-gray-500">
                      {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                    </span>
                  </div>
                </TableCell>

                {/* Email */}
                <TableCell className="text-gray-600">
                  {user.email}
                </TableCell>

                {/* Temas */}
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {temas.length === 0 ? (
                      <span className="text-sm text-gray-400">
                        Sem permissões
                      </span>
                    ) : (
                      temas.map((tema) => (
                        <span
                          key={tema}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
                        >
                          {tema}
                        </span>
                      ))
                    )}
                  </div>
                </TableCell>

                {/* Ações */}
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(user)}
                      title="Editar usuário"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(user.id, user.nome)}
                      disabled={deletingId === user.id}
                      title="Deletar usuário"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
