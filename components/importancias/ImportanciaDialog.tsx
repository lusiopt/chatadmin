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
import { Importancia } from './ImportanciaList';

interface ImportanciaDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Importancia>) => Promise<void>;
  importancia?: Importancia | null;
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

export function ImportanciaDialog({ open, onClose, onSubmit, importancia }: ImportanciaDialogProps) {
  const [nome, setNome] = useState('');
  const [slug, setSlug] = useState('');
  const [descricao, setDescricao] = useState('');
  const [cor, setCor] = useState('gray');
  const [ordem, setOrdem] = useState(0);
  const [saving, setSaving] = useState(false);

  const isEditing = !!importancia;

  // Preencher formulario ao editar
  useEffect(() => {
    if (importancia) {
      setNome(importancia.nome);
      setSlug(importancia.slug);
      setDescricao(importancia.descricao || '');
      setCor(importancia.cor);
      setOrdem(importancia.ordem);
    } else {
      // Limpar ao criar novo
      setNome('');
      setSlug('');
      setDescricao('');
      setCor('gray');
      setOrdem(0);
    }
  }, [importancia, open]);

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
      alert('Nome e slug sao obrigatorios');
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
              {isEditing ? 'Editar Importancia' : 'Nova Importancia'}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Altere as informacoes da importancia'
                : 'Preencha as informacoes da nova importancia'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Nome */}
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                placeholder="Ex: Urgente"
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
                placeholder="Ex: urgent"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                required
                pattern="[a-z0-9-]+"
                title="Apenas letras minusculas, numeros e hifens"
              />
              <p className="text-xs text-gray-500">
                Identificador unico. Apenas letras minusculas, numeros e hifens.
              </p>
            </div>

            {/* Descricao */}
            <div className="grid gap-2">
              <Label htmlFor="descricao">Descricao</Label>
              <Input
                id="descricao"
                placeholder="Descricao breve da importancia"
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
              <Label htmlFor="ordem">Ordem de exibicao</Label>
              <Input
                id="ordem"
                type="number"
                min="0"
                value={ordem}
                onChange={(e) => setOrdem(parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-gray-500">
                Menor numero aparece primeiro (ex: 0 = Urgente primeiro)
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
