'use client';

import { useState } from 'react';
import { Megaphone, Edit, Trash2, Calendar, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Announcement } from './AnnouncementDialog';

interface AnnouncementListProps {
  announcements: Announcement[];
  loading: boolean;
  onEdit: (announcement: Announcement) => void;
  onDelete: (id: string) => void;
}

const TEMA_COLORS: Record<string, string> = {
  'Cartões': 'bg-blue-100 text-blue-700',
  'Milhas': 'bg-green-100 text-green-700',
  'Network': 'bg-purple-100 text-purple-700',
};

export function AnnouncementList({ announcements, loading, onEdit, onDelete }: AnnouncementListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Tem certeza que deseja deletar o aviso "${title}"?`)) {
      return;
    }

    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Carregando avisos...</div>
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <Megaphone className="w-12 h-12 mb-2 text-gray-400" />
        <p>Nenhum aviso cadastrado</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Título</TableHead>
            <TableHead>Tema</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Criado em</TableHead>
            <TableHead className="w-[100px] text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {announcements.map((announcement) => (
            <TableRow key={announcement.id}>
              {/* Título e preview */}
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{announcement.title}</span>
                  <span className="text-sm text-gray-500 line-clamp-1">
                    {announcement.content}
                  </span>
                </div>
              </TableCell>

              {/* Tema */}
              <TableCell>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${TEMA_COLORS[announcement.tema] || 'bg-gray-100 text-gray-700'}`}>
                  <Tag className="w-3 h-3 mr-1" />
                  {announcement.tema}
                </span>
              </TableCell>

              {/* Status */}
              <TableCell>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  announcement.status === 'published'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {announcement.status === 'published' ? 'Publicado' : 'Rascunho'}
                </span>
              </TableCell>

              {/* Data */}
              <TableCell className="text-gray-600 text-sm">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(announcement.created_at)}
                </div>
              </TableCell>

              {/* Ações */}
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(announcement)}
                    title="Editar aviso"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(announcement.id, announcement.title)}
                    disabled={deletingId === announcement.id}
                    title="Deletar aviso"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
