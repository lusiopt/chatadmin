'use client';

import { Pencil, Power, PowerOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface Importancia {
  id: string;
  slug: string;
  nome: string;
  descricao?: string;
  cor: string;
  icone?: string;
  ativo: boolean;
  ordem: number;
  created_at: string;
  updated_at: string;
}

interface ImportanciaListProps {
  importancias: Importancia[];
  loading: boolean;
  onEdit: (importancia: Importancia) => void;
  onDelete: (importanciaId: string) => void;
  onReactivate: (importanciaId: string) => void;
}

// Mapeamento de cores para classes Tailwind
const COR_CLASSES: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  purple: 'bg-purple-100 text-purple-700',
  red: 'bg-red-100 text-red-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  orange: 'bg-orange-100 text-orange-700',
  pink: 'bg-pink-100 text-pink-700',
  gray: 'bg-gray-100 text-gray-700',
};

export function ImportanciaList({ importancias, loading, onEdit, onDelete, onReactivate }: ImportanciaListProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-3 text-gray-600">Carregando importancias...</span>
        </div>
      </div>
    );
  }

  if (importancias.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="text-center text-gray-500">
          Nenhuma importancia cadastrada
        </div>
      </div>
    );
  }

  const handleDelete = (importancia: Importancia) => {
    if (confirm(`Tem certeza que deseja desativar a importancia "${importancia.nome}"?`)) {
      onDelete(importancia.id);
    }
  };

  const handleReactivate = (importancia: Importancia) => {
    if (confirm(`Reativar a importancia "${importancia.nome}"?`)) {
      onReactivate(importancia.id);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Ordem</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Cor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Acoes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {importancias.map((importancia) => (
            <TableRow key={importancia.id} className={!importancia.ativo ? 'opacity-50' : ''}>
              <TableCell className="font-mono text-sm text-center">
                {importancia.ordem}
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{importancia.nome}</div>
                  {importancia.descricao && (
                    <div className="text-sm text-gray-500 truncate max-w-xs">
                      {importancia.descricao}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                  {importancia.slug}
                </code>
              </TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                    COR_CLASSES[importancia.cor] || COR_CLASSES.gray
                  }`}
                >
                  {importancia.cor}
                </span>
              </TableCell>
              <TableCell>
                {importancia.ativo ? (
                  <span className="inline-flex items-center rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                    Ativo
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                    Inativo
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(importancia)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  {importancia.ativo ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(importancia)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <PowerOff className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReactivate(importancia)}
                      className="text-green-600 hover:text-green-700"
                    >
                      <Power className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
