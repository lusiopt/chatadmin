'use client';

import { useState, useEffect } from 'react';
import { Plus, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { TemaList, Tema } from '@/components/temas/TemaList';
import { TemaDialog } from '@/components/temas/TemaDialog';
import { ImportanciaList, Importancia } from '@/components/importancias/ImportanciaList';
import { ImportanciaDialog } from '@/components/importancias/ImportanciaDialog';
import api from '@/lib/api';

export default function TemasPage() {
  // === TEMAS ===
  const [temas, setTemas] = useState<Tema[]>([]);
  const [loadingTemas, setLoadingTemas] = useState(true);
  const [temaDialogOpen, setTemaDialogOpen] = useState(false);
  const [editingTema, setEditingTema] = useState<Tema | null>(null);

  // === IMPORTANCIAS ===
  const [importancias, setImportancias] = useState<Importancia[]>([]);
  const [loadingImportancias, setLoadingImportancias] = useState(true);
  const [importanciaDialogOpen, setImportanciaDialogOpen] = useState(false);
  const [editingImportancia, setEditingImportancia] = useState<Importancia | null>(null);

  // === TEMAS: Buscar, Criar, Atualizar, Desativar, Reativar ===
  const fetchTemas = async () => {
    setLoadingTemas(true);
    try {
      const { data } = await api.get('/api/temas');
      setTemas(data.temas);
    } catch (error: any) {
      console.error('Erro ao buscar temas:', error);
      alert(error.response?.data?.error || 'Erro ao carregar temas');
    } finally {
      setLoadingTemas(false);
    }
  };

  const handleCreateTema = async (temaData: Partial<Tema>) => {
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

  const handleUpdateTema = async (temaData: Partial<Tema>) => {
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

  const handleDeleteTema = async (temaId: string) => {
    try {
      await api.delete(`/api/temas/${temaId}`);
      alert('Tema desativado com sucesso!');
      fetchTemas();
    } catch (error: any) {
      console.error('Erro ao desativar tema:', error);
      alert(error.response?.data?.error || 'Erro ao desativar tema');
    }
  };

  const handleReactivateTema = async (temaId: string) => {
    try {
      await api.patch(`/api/temas/${temaId}`, { ativo: true });
      alert('Tema reativado com sucesso!');
      fetchTemas();
    } catch (error: any) {
      console.error('Erro ao reativar tema:', error);
      alert(error.response?.data?.error || 'Erro ao reativar tema');
    }
  };

  const handleEditTema = (tema: Tema) => {
    setEditingTema(tema);
    setTemaDialogOpen(true);
  };

  const handleOpenCreateTema = () => {
    setEditingTema(null);
    setTemaDialogOpen(true);
  };

  const handleCloseTemaDialog = () => {
    setTemaDialogOpen(false);
    setEditingTema(null);
  };

  // === IMPORTANCIAS: Buscar, Criar, Atualizar, Desativar, Reativar ===
  const fetchImportancias = async () => {
    setLoadingImportancias(true);
    try {
      const { data } = await api.get('/api/importancias');
      setImportancias(data.importancias);
    } catch (error: any) {
      console.error('Erro ao buscar importancias:', error);
      alert(error.response?.data?.error || 'Erro ao carregar importancias');
    } finally {
      setLoadingImportancias(false);
    }
  };

  const handleCreateImportancia = async (importanciaData: Partial<Importancia>) => {
    try {
      await api.post('/api/importancias', importanciaData);
      alert('Importancia criada com sucesso!');
      fetchImportancias();
    } catch (error: any) {
      console.error('Erro ao criar importancia:', error);
      alert(error.response?.data?.error || 'Erro ao criar importancia');
      throw error;
    }
  };

  const handleUpdateImportancia = async (importanciaData: Partial<Importancia>) => {
    if (!editingImportancia) return;
    try {
      await api.patch(`/api/importancias/${editingImportancia.id}`, importanciaData);
      alert('Importancia atualizada com sucesso!');
      fetchImportancias();
    } catch (error: any) {
      console.error('Erro ao atualizar importancia:', error);
      alert(error.response?.data?.error || 'Erro ao atualizar importancia');
      throw error;
    }
  };

  const handleDeleteImportancia = async (importanciaId: string) => {
    try {
      await api.delete(`/api/importancias/${importanciaId}`);
      alert('Importancia desativada com sucesso!');
      fetchImportancias();
    } catch (error: any) {
      console.error('Erro ao desativar importancia:', error);
      alert(error.response?.data?.error || 'Erro ao desativar importancia');
    }
  };

  const handleReactivateImportancia = async (importanciaId: string) => {
    try {
      await api.patch(`/api/importancias/${importanciaId}`, { ativo: true });
      alert('Importancia reativada com sucesso!');
      fetchImportancias();
    } catch (error: any) {
      console.error('Erro ao reativar importancia:', error);
      alert(error.response?.data?.error || 'Erro ao reativar importancia');
    }
  };

  const handleEditImportancia = (importancia: Importancia) => {
    setEditingImportancia(importancia);
    setImportanciaDialogOpen(true);
  };

  const handleOpenCreateImportancia = () => {
    setEditingImportancia(null);
    setImportanciaDialogOpen(true);
  };

  const handleCloseImportanciaDialog = () => {
    setImportanciaDialogOpen(false);
    setEditingImportancia(null);
  };

  // === Carregar dados ao montar ===
  useEffect(() => {
    fetchTemas();
    fetchImportancias();
  }, []);

  // Atualizar tudo
  const handleRefreshAll = () => {
    fetchTemas();
    fetchImportancias();
  };

  const isLoading = loadingTemas || loadingImportancias;

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
              <h1 className="text-3xl font-bold">Temas e Importancias</h1>
              <p className="text-gray-600">
                Gerenciar temas e niveis de importancia para avisos
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={handleRefreshAll} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Secao 1: Temas */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Temas</h2>
              <p className="text-sm text-gray-500">Categorias para segmentacao de avisos</p>
            </div>
            <Button onClick={handleOpenCreateTema} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Novo Tema
            </Button>
          </div>
          <TemaList
            temas={temas}
            loading={loadingTemas}
            onEdit={handleEditTema}
            onDelete={handleDeleteTema}
            onReactivate={handleReactivateTema}
          />
        </div>

        {/* Secao 2: Importancias */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Importancias</h2>
              <p className="text-sm text-gray-500">Niveis de prioridade para avisos (ex: Normal, Urgente)</p>
            </div>
            <Button onClick={handleOpenCreateImportancia} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Nova Importancia
            </Button>
          </div>
          <ImportanciaList
            importancias={importancias}
            loading={loadingImportancias}
            onEdit={handleEditImportancia}
            onDelete={handleDeleteImportancia}
            onReactivate={handleReactivateImportancia}
          />
        </div>

        {/* Dialog de Criar/Editar Tema */}
        <TemaDialog
          open={temaDialogOpen}
          onClose={handleCloseTemaDialog}
          onSubmit={editingTema ? handleUpdateTema : handleCreateTema}
          tema={editingTema}
        />

        {/* Dialog de Criar/Editar Importancia */}
        <ImportanciaDialog
          open={importanciaDialogOpen}
          onClose={handleCloseImportanciaDialog}
          onSubmit={editingImportancia ? handleUpdateImportancia : handleCreateImportancia}
          importancia={editingImportancia}
        />
      </div>
    </div>
  );
}
