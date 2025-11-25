'use client';

import { useState, useEffect } from 'react';
import { X, Image, Link2, Plus } from 'lucide-react';
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
import { IPhonePreview } from './iPhonePreview';
import { HeroTemplate } from './templates/HeroTemplate';
import { Attachment, AnnouncementTemplate, TEMPLATES, createImageAttachment, createLinkAttachment } from './types';

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
  template?: AnnouncementTemplate;
  attachments?: Attachment[];
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
  template: AnnouncementTemplate;
  attachments: Attachment[];
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
    template: 'hero' as AnnouncementTemplate,
    attachments: [] as Attachment[],
    image_url: '',
    link_url: '',
    link_text: ''
  });

  // UI states para adicionar attachments
  const [showImageInput, setShowImageInput] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');

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
        // Converter campos antigos para attachments se necessário
        let attachments = announcement.attachments || [];
        if (!attachments.length) {
          if (announcement.image_url) {
            attachments.push(createImageAttachment(announcement.image_url));
          }
          if (announcement.link_url) {
            attachments.push(createLinkAttachment(announcement.link_url, announcement.link_text));
          }
        }

        setFormData({
          title: announcement.title,
          content: announcement.content,
          tema_ids: announcement.temas?.map(t => t.id) || [],
          status: announcement.status,
          template: announcement.template || 'hero',
          attachments,
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
          template: 'hero',
          attachments: [],
          image_url: '',
          link_url: '',
          link_text: ''
        });
      }
      // Reset UI states
      setShowImageInput(false);
      setShowLinkInput(false);
      setNewImageUrl('');
      setNewLinkUrl('');
      setNewLinkTitle('');
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

  // Adicionar imagem
  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, createImageAttachment(newImageUrl.trim())]
      }));
      setNewImageUrl('');
      setShowImageInput(false);
    }
  };

  // Adicionar link
  const handleAddLink = () => {
    if (newLinkUrl.trim()) {
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, createLinkAttachment(newLinkUrl.trim(), newLinkTitle.trim() || undefined)]
      }));
      setNewLinkUrl('');
      setNewLinkTitle('');
      setShowLinkInput(false);
    }
  };

  // Remover attachment
  const handleRemoveAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
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
        template: formData.template,
        attachments: formData.attachments,
        // Manter campos antigos para backwards compat
        image_url: formData.attachments.find(a => a.type === 'image')?.imageUrl,
        link_url: formData.attachments.find(a => a.type === 'link')?.titleLink,
        link_text: formData.attachments.find(a => a.type === 'link')?.title
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar aviso:', error);
    } finally {
      setLoading(false);
    }
  };

  // Pegar tema selecionado para preview
  const selectedTema = temas.find(t => formData.tema_ids.includes(t.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden">
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

        <div className="flex gap-6 overflow-hidden">
          {/* Formulário - Lado Esquerdo */}
          <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto pr-4" style={{ maxHeight: 'calc(95vh - 180px)' }}>
            {/* Template */}
            <div className="space-y-2">
              <Label htmlFor="template">Template</Label>
              <select
                id="template"
                value={formData.template}
                onChange={(e) => setFormData({ ...formData, template: e.target.value as AnnouncementTemplate })}
                className="w-full px-3 py-2 border rounded-md"
              >
                {Object.entries(TEMPLATES).map(([key, config]) => (
                  <option key={key} value={key} disabled={!config.available}>
                    {config.label} {!config.available && '(em breve)'}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500">{TEMPLATES[formData.template].description}</p>
            </div>

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
                rows={4}
                className="w-full px-3 py-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Mídia / Attachments */}
            <div className="space-y-2">
              <Label>Mídia</Label>

              {/* Lista de attachments */}
              {formData.attachments.length > 0 && (
                <div className="space-y-2 mb-2">
                  {formData.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                      {attachment.type === 'image' && (
                        <>
                          <Image className="w-4 h-4 text-blue-500" />
                          <span className="text-sm flex-1 truncate">{attachment.imageUrl}</span>
                        </>
                      )}
                      {attachment.type === 'link' && (
                        <>
                          <Link2 className="w-4 h-4 text-green-500" />
                          <span className="text-sm flex-1 truncate">{attachment.title || attachment.titleLink}</span>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(index)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Botões para adicionar */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowImageInput(!showImageInput)}
                >
                  <Image className="w-4 h-4 mr-1" />
                  Imagem
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLinkInput(!showLinkInput)}
                >
                  <Link2 className="w-4 h-4 mr-1" />
                  Link
                </Button>
              </div>

              {/* Input para nova imagem */}
              {showImageInput && (
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="https://exemplo.com/imagem.jpg"
                    className="flex-1"
                  />
                  <Button type="button" size="sm" onClick={handleAddImage}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Input para novo link */}
              {showLinkInput && (
                <div className="space-y-2 mt-2">
                  <Input
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    placeholder="https://exemplo.com"
                  />
                  <div className="flex gap-2">
                    <Input
                      value={newLinkTitle}
                      onChange={(e) => setNewLinkTitle(e.target.value)}
                      placeholder="Texto do link (opcional)"
                      className="flex-1"
                    />
                    <Button type="button" size="sm" onClick={handleAddLink}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Temas (multi-select) */}
            <div className="space-y-2">
              <Label>Temas * <span className="text-sm text-gray-500">(selecione um ou mais)</span></Label>
              {loadingTemas ? (
                <p className="text-sm text-gray-500">Carregando temas...</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 p-3 border rounded-md max-h-32 overflow-y-auto">
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

            <DialogFooter className="pt-4">
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

          {/* Preview - Lado Direito */}
          <div className="flex-shrink-0 border-l pl-6">
            <IPhonePreview>
              {formData.template === 'hero' && (
                <HeroTemplate
                  title={formData.title}
                  content={formData.content}
                  attachments={formData.attachments}
                  temaName={selectedTema?.nome}
                  temaColor={selectedTema?.cor}
                />
              )}
            </IPhonePreview>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
