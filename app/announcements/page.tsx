'use client';

import { useState, useEffect } from 'react';
import { Plus, ArrowLeft, RefreshCw, Megaphone } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AnnouncementList } from '@/components/announcements/AnnouncementList';
import { AnnouncementDialog, Announcement, AnnouncementFormData } from '@/components/announcements/AnnouncementDialog';
import api from '@/lib/api';

interface Tema {
  id: string;
  slug: string;
  nome: string;
  cor: string;
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [filterTema, setFilterTema] = useState<string>('');
  const [temas, setTemas] = useState<Tema[]>([]);

  // Buscar temas da API
  useEffect(() => {
    const fetchTemas = async () => {
      try {
        const { data } = await api.get('/api/temas?ativo=true');
        setTemas(data.temas);
      } catch (error) {
        console.error('Erro ao buscar temas:', error);
      }
    };
    fetchTemas();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterTema) params.append('tema_id', filterTema);

      const { data } = await api.get(`/api/announcements?${params}`);
      setAnnouncements(data.announcements);
    } catch (error) {
      console.error('Erro ao buscar avisos:', error);
      alert('Erro ao carregar avisos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [filterTema]);

  const handleCreate = async (formData: AnnouncementFormData) => {
    try {
      await api.post('/api/announcements', formData);
      alert('Aviso criado com sucesso!');
      fetchAnnouncements();
    } catch (error: any) {
      console.error('Erro ao criar aviso:', error);
      alert(error.response?.data?.error || 'Erro ao criar aviso');
      throw error;
    }
  };

  const handleUpdate = async (formData: AnnouncementFormData) => {
    if (!editingAnnouncement) return;

    try {
      await api.patch(`/api/announcements/${editingAnnouncement.id}`, formData);
      alert('Aviso atualizado com sucesso!');
      fetchAnnouncements();
    } catch (error: any) {
      console.error('Erro ao atualizar aviso:', error);
      alert(error.response?.data?.error || 'Erro ao atualizar aviso');
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/announcements/${id}`);
      alert('Aviso deletado com sucesso!');
      fetchAnnouncements();
    } catch (error: any) {
      console.error('Erro ao deletar aviso:', error);
      alert(error.response?.data?.error || 'Erro ao deletar aviso');
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setDialogOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingAnnouncement(null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingAnnouncement(null);
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
              <h1 className="text-4xl font-bold mb-2">Avisos</h1>
              <p className="text-gray-600">
                Gerencie os avisos do feed de atividades
              </p>
            </div>

            <div className="flex gap-2">
              <select
                value={filterTema}
                onChange={(e) => setFilterTema(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="">Todos os temas</option>
                {temas.map((tema) => (
                  <option key={tema.id} value={tema.id}>{tema.nome}</option>
                ))}
              </select>
              <Button
                variant="outline"
                onClick={fetchAnnouncements}
                disabled={loading}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
              <Button onClick={handleOpenCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Aviso
              </Button>
            </div>
          </div>
        </div>

        {/* Lista de avisos */}
        <div className="bg-white rounded-lg shadow-sm">
          <AnnouncementList
            announcements={announcements}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>

      {/* Dialog de criação/edição */}
      <AnnouncementDialog
        open={dialogOpen}
        onOpenChange={handleCloseDialog}
        announcement={editingAnnouncement}
        onSave={editingAnnouncement ? handleUpdate : handleCreate}
      />
    </div>
  );
}
