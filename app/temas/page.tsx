'use client';

import { useState, useEffect } from 'react';
import { Plus, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { TemaList, Tema } from '@/components/temas/TemaList';
import { TemaDialog } from '@/components/temas/TemaDialog';
import api from '@/lib/api';

export default function TemasPage() {
  const [temas, setTemas] = useState<Tema[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTema, setEditingTema] = useState<Tema | null>(null);

  // Buscar temas
  const fetchTemas = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/temas');
      setTemas(data.temas);
    } catch (error: any) {
      console.error('Erro ao buscar temas:', error);
      alert(error.response?.data?.error || 'Erro ao carregar temas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemas();
  }, []);

  // Criar novo tema
  const handleCreate = async (temaData: Partial<Tema>) => {
    try {
      await api.post('/api/temas', temaData);
      alert('Tema criado com sucesso!');
      fetchTemas();
    } catch (error: any) {
      console.error('Erro ao criar tema:', error);
      alert(error.response?.data?.error || 'Erro ao criar tema');
      throw error;
    }
  };

  // Atualizar tema existente
  const handleUpdate = async (temaData: Partial<Tema>) => {
    if (!editingTema) return;

    try {
      await api.patch(`/api/temas/${editingTema.id}`, temaData);
      alert('Tema atualizado com sucesso!');
      fetchTemas();
    } catch (error: any) {
      console.error('Erro ao atualizar tema:', error);
      alert(error.response?.data?.error || 'Erro ao atualizar tema');
      throw error;
    }
  };

  // Desativar tema
  const handleDelete = async (temaId: string) => {
    try {
      await api.delete(`/api/temas/${temaId}`);
      alert('Tema desativado com sucesso!');
      fetchTemas();
    } catch (error: any) {
      console.error('Erro ao desativar tema:', error);
      alert(error.response?.data?.error || 'Erro ao desativar tema');
    }
  };

  // Reativar tema
  const handleReactivate = async (temaId: string) => {
    try {
      await api.patch(`/api/temas/${temaId}`, { ativo: true });
      alert('Tema reativado com sucesso!');
      fetchTemas();
    } catch (error: any) {
      console.error('Erro ao reativar tema:', error);
      alert(error.response?.data?.error || 'Erro ao reativar tema');
    }
  };

  // Abrir dialog para edição
  const handleEdit = (tema: Tema) => {
    setEditingTema(tema);
    setDialogOpen(true);
  };

  // Abrir dialog para criar
  const handleOpenCreate = () => {
    setEditingTema(null);
    setDialogOpen(true);
  };

  // Fechar dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTema(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Temas</h1>
              <p className="text-gray-600">
                Gerenciar temas para segmentação de avisos e permissões
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchTemas} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button onClick={handleOpenCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Tema
            </Button>
          </div>
        </div>

        {/* Lista de Temas */}
        <TemaList
          temas={temas}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onReactivate={handleReactivate}
        />

        {/* Dialog de Criar/Editar */}
        <TemaDialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          onSubmit={editingTema ? handleUpdate : handleCreate}
          tema={editingTema}
        />
      </div>
    </div>
  );
}
