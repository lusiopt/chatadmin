'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AvatarUpload } from './AvatarUpload';
import { PermissionGrid, TemaPermissions } from './PermissionGrid';

export type User = {
  id: string;
  email: string;
  nome: string;
  avatar?: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
  user_permissions?: TemaPermissions[];
};

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
  onSave: (user: Partial<User>) => Promise<void>;
}

export function UserDialog({ open, onOpenChange, user, onSave }: UserDialogProps) {
  const isEdit = !!user;
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    avatar: '',
    role: 'user' as 'admin' | 'user',
    permissions: [] as TemaPermissions[]
  });

  // Reset form quando abrir/fechar dialog
  useEffect(() => {
    if (open) {
      if (user) {
        setFormData({
          nome: user.nome,
          email: user.email,
          avatar: user.avatar || '',
          role: user.role,
          permissions: user.user_permissions || []
        });
      } else {
        setFormData({
          nome: '',
          email: '',
          avatar: '',
          role: 'user',
          permissions: []
        });
      }
    }
  }, [open, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const temas = formData.permissions.map((p) => p.tema);

      await onSave({
        nome: formData.nome,
        email: formData.email,
        avatar: formData.avatar,
        role: formData.role,
        temas
      } as any);

      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      alert('Erro ao salvar usuário');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Editar Usuário' : 'Novo Usuário'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Atualize os dados e permissões do usuário'
              : 'Preencha os dados e configure as permissões do novo usuário'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar */}
          <div className="flex justify-center">
            <AvatarUpload
              value={formData.avatar}
              onChange={(url) => setFormData({ ...formData, avatar: url })}
              userId={user?.id}
            />
          </div>

          {/* Campos básicos */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                placeholder="Nome completo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="usuario@exemplo.com"
                required
                disabled={isEdit} // Email não pode ser alterado
              />
            </div>
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role">Função</Label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value as 'admin' | 'user' })
              }
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="user">Usuário</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          {/* Permissões por tema */}
          <div className="space-y-2">
            <Label>Permissões por Tema</Label>
            <PermissionGrid
              permissions={formData.permissions}
              onChange={(permissions) =>
                setFormData({ ...formData, permissions })
              }
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : isEdit ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
