'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tema } from './TemaList';

interface TemaDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Tema>) => Promise<void>;
  tema?: Tema | null;
}

const CORES_DISPONIVEIS = [
  { value: 'blue', label: 'Azul', class: 'bg-blue-500' },
  { value: 'green', label: 'Verde', class: 'bg-green-500' },
  { value: 'purple', label: 'Roxo', class: 'bg-purple-500' },
  { value: 'red', label: 'Vermelho', class: 'bg-red-500' },
  { value: 'yellow', label: 'Amarelo', class: 'bg-yellow-500' },
  { value: 'orange', label: 'Laranja', class: 'bg-orange-500' },
  { value: 'pink', label: 'Rosa', class: 'bg-pink-500' },
  { value: 'gray', label: 'Cinza', class: 'bg-gray-500' },
];

export function TemaDialog({ open, onClose, onSubmit, tema }: TemaDialogProps) {
  const [nome, setNome] = useState('');
  const [slug, setSlug] = useState('');
  const [descricao, setDescricao] = useState('');
  const [cor, setCor] = useState('blue');
  const [ordem, setOrdem] = useState(0);
  const [saving, setSaving] = useState(false);

  const isEditing = !!tema;

  // Preencher formulário ao editar
  useEffect(() => {
    if (tema) {
      setNome(tema.nome);
      setSlug(tema.slug);
      setDescricao(tema.descricao || '');
      setCor(tema.cor);
      setOrdem(tema.ordem);
    } else {
      // Limpar ao criar novo
      setNome('');
      setSlug('');
      setDescricao('');
      setCor('blue');
      setOrdem(0);
    }
  }, [tema, open]);

  // Gerar slug automaticamente a partir do nome
  const handleNomeChange = (value: string) => {
    setNome(value);
    if (!isEditing) {
      // Gerar slug apenas ao criar novo
      const generatedSlug = value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z0-9]+/g, '-') // Substitui caracteres especiais por hifen
        .replace(/^-|-$/g, ''); // Remove hifens do inicio/fim
      setSlug(generatedSlug);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim() || !slug.trim()) {
      alert('Nome e slug são obrigatórios');
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        nome: nome.trim(),
        slug: slug.trim(),
        descricao: descricao.trim() || undefined,
        cor,
        ordem,
      });
      onClose();
    } catch (error) {
      // Erro ja tratado no onSubmit
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Editar Tema' : 'Novo Tema'}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Altere as informações do tema'
                : 'Preencha as informações do novo tema'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Nome */}
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                placeholder="Ex: Cartões de Crédito"
                value={nome}
                onChange={(e) => handleNomeChange(e.target.value)}
                required
              />
            </div>

            {/* Slug */}
            <div className="grid gap-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                placeholder="Ex: cartoes-credito"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                required
                pattern="[a-z0-9-]+"
                title="Apenas letras minúsculas, números e hífens"
              />
              <p className="text-xs text-gray-500">
                Usado em URLs e feeds. Apenas letras minúsculas, números e hífens.
              </p>
            </div>

            {/* Descrição */}
            <div className="grid gap-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                placeholder="Descrição breve do tema"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </div>

            {/* Cor */}
            <div className="grid gap-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {CORES_DISPONIVEIS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCor(c.value)}
                    className={`w-8 h-8 rounded-full ${c.class} ${
                      cor === c.value
                        ? 'ring-2 ring-offset-2 ring-gray-900'
                        : 'opacity-50 hover:opacity-100'
                    }`}
                    title={c.label}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500">
                Cor selecionada: {CORES_DISPONIVEIS.find(c => c.value === cor)?.label}
              </p>
            </div>

            {/* Ordem */}
            <div className="grid gap-2">
              <Label htmlFor="ordem">Ordem de exibição</Label>
              <Input
                id="ordem"
                type="number"
                min="0"
                value={ordem}
                onChange={(e) => setOrdem(parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-gray-500">
                Menor número aparece primeiro
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
