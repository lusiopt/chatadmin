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
import api from '@/lib/api';

interface Tema {
  id: string;
  slug: string;
  nome: string;
  cor: string;
}

export type Announcement = {
  id: string;
  title: string;
  content: string;
  temas: Tema[];
  status: 'draft' | 'published';
  image_url?: string;
  link_url?: string;
  link_text?: string;
  created_at: string;
  updated_at: string;
};

export interface AnnouncementFormData {
  title: string;
  content: string;
  tema_ids: string[];
  status: 'draft' | 'published';
  image_url?: string;
  link_url?: string;
  link_text?: string;
}

interface AnnouncementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  announcement?: Announcement | null;
  onSave: (data: AnnouncementFormData) => Promise<void>;
}

export function AnnouncementDialog({ open, onOpenChange, announcement, onSave }: AnnouncementDialogProps) {
  const isEdit = !!announcement;
  const [loading, setLoading] = useState(false);
  const [temas, setTemas] = useState<Tema[]>([]);
  const [loadingTemas, setLoadingTemas] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tema_ids: [] as string[],
    status: 'draft' as 'draft' | 'published',
    image_url: '',
    link_url: '',
    link_text: ''
  });

  // Buscar temas da API
  useEffect(() => {
    const fetchTemas = async () => {
      try {
        const { data } = await api.get('/api/temas?ativo=true');
        setTemas(data.temas);
      } catch (error) {
        console.error('Erro ao buscar temas:', error);
      } finally {
        setLoadingTemas(false);
      }
    };
    fetchTemas();
  }, []);

  useEffect(() => {
    if (open) {
      if (announcement) {
        setFormData({
          title: announcement.title,
          content: announcement.content,
          tema_ids: announcement.temas?.map(t => t.id) || [],
          status: announcement.status,
          image_url: announcement.image_url || '',
          link_url: announcement.link_url || '',
          link_text: announcement.link_text || ''
        });
      } else {
        setFormData({
          title: '',
          content: '',
          tema_ids: [],
          status: 'draft',
          image_url: '',
          link_url: '',
          link_text: ''
        });
      }
    }
  }, [open, announcement]);

  const handleTemaToggle = (temaId: string) => {
    setFormData(prev => {
      const isSelected = prev.tema_ids.includes(temaId);
      if (isSelected) {
        return { ...prev, tema_ids: prev.tema_ids.filter(id => id !== temaId) };
      } else {
        return { ...prev, tema_ids: [...prev.tema_ids, temaId] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.tema_ids.length === 0) {
      alert('Selecione pelo menos um tema');
      return;
    }

    setLoading(true);

    try {
      await onSave({
        title: formData.title,
        content: formData.content,
        tema_ids: formData.tema_ids,
        status: formData.status,
        image_url: formData.image_url || undefined,
        link_url: formData.link_url || undefined,
        link_text: formData.link_text || undefined
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar aviso:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Editar Aviso' : 'Novo Aviso'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Atualize as informações do aviso'
              : 'Preencha os dados para criar um novo aviso'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Título do aviso"
              required
            />
          </div>

          {/* Conteúdo */}
          <div className="space-y-2">
            <Label htmlFor="content">Conteúdo *</Label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Conteúdo do aviso..."
              required
              rows={5}
              className="w-full px-3 py-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Temas (multi-select) */}
          <div className="space-y-2">
            <Label>Temas * <span className="text-sm text-gray-500">(selecione um ou mais)</span></Label>
            {loadingTemas ? (
              <p className="text-sm text-gray-500">Carregando temas...</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 p-3 border rounded-md max-h-40 overflow-y-auto">
                {temas.map((tema) => (
                  <label
                    key={tema.id}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-50 ${
                      formData.tema_ids.includes(tema.id) ? 'bg-blue-50 border border-blue-200' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.tema_ids.includes(tema.id)}
                      onChange={() => handleTemaToggle(tema.id)}
                      className="rounded border-gray-300"
                    />
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: tema.cor || '#gray' }}
                    />
                    <span className="text-sm">{tema.nome}</span>
                  </label>
                ))}
              </div>
            )}
            {formData.tema_ids.length === 0 && !loadingTemas && (
              <p className="text-sm text-red-500">Selecione pelo menos um tema</p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'published' })}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="draft">Rascunho</option>
              <option value="published">Publicado</option>
            </select>
          </div>

          {/* Imagem (opcional) */}
          <div className="space-y-2">
            <Label htmlFor="image_url">URL da Imagem (opcional)</Label>
            <Input
              id="image_url"
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://exemplo.com/imagem.jpg"
            />
          </div>

          {/* Link (opcional) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="link_url">URL do Link (opcional)</Label>
              <Input
                id="link_url"
                type="url"
                value={formData.link_url}
                onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                placeholder="https://exemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="link_text">Texto do Link (opcional)</Label>
              <Input
                id="link_text"
                value={formData.link_text}
                onChange={(e) => setFormData({ ...formData, link_text: e.target.value })}
                placeholder="Saiba mais"
              />
            </div>
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
            <Button type="submit" disabled={loading || loadingTemas}>
              {loading ? 'Salvando...' : isEdit ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
