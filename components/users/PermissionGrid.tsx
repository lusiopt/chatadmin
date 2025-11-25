'use client';

import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';

interface Tema {
  id: string;
  slug: string;
  nome: string;
  cor: string;
}

export type TemaPermissions = {
  tema: string;
  can_view_chat: boolean;
  can_send_messages: boolean;
  can_view_announcements: boolean;
  can_create_announcements: boolean;
  can_moderate: boolean;
  can_delete_messages: boolean;
};

interface PermissionGridProps {
  permissions: TemaPermissions[];
  onChange: (permissions: TemaPermissions[]) => void;
}

const PERMISSION_LABELS = {
  can_view_chat: 'Ver Chat',
  can_send_messages: 'Enviar Mensagens',
  can_view_announcements: 'Ver Avisos',
  can_create_announcements: 'Criar Avisos',
  can_moderate: 'Moderar',
  can_delete_messages: 'Deletar Mensagens'
};

// Mapeamento de cores para classes Tailwind
const COR_CLASSES: Record<string, string> = {
  blue: 'border-blue-500',
  green: 'border-green-500',
  purple: 'border-purple-500',
  red: 'border-red-500',
  yellow: 'border-yellow-500',
  orange: 'border-orange-500',
  pink: 'border-pink-500',
  gray: 'border-gray-500',
};

export function PermissionGrid({ permissions, onChange }: PermissionGridProps) {
  const [temas, setTemas] = useState<Tema[]>([]);
  const [loading, setLoading] = useState(true);

  // Buscar temas da API
  useEffect(() => {
    const fetchTemas = async () => {
      try {
        const { data } = await api.get('/api/temas?ativo=true');
        setTemas(data.temas);
      } catch (error) {
        console.error('Erro ao buscar temas:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTemas();
  }, []);

  const handleTemaToggle = (temaSlug: string, enabled: boolean) => {
    if (enabled) {
      // Adicionar tema com permissoes padrao
      onChange([
        ...permissions,
        {
          tema: temaSlug,
          can_view_chat: true,
          can_send_messages: true,
          can_view_announcements: true,
          can_create_announcements: false,
          can_moderate: false,
          can_delete_messages: false
        }
      ]);
    } else {
      // Remover tema
      onChange(permissions.filter((p) => p.tema !== temaSlug));
    }
  };

  const handlePermissionChange = (
    temaSlug: string,
    permission: keyof Omit<TemaPermissions, 'tema'>,
    value: boolean
  ) => {
    onChange(
      permissions.map((p) =>
        p.tema === temaSlug ? { ...p, [permission]: value } : p
      )
    );
  };

  if (loading) {
    return (
      <div className="text-sm text-gray-500">Carregando temas...</div>
    );
  }

  if (temas.length === 0) {
    return (
      <div className="text-sm text-gray-500">Nenhum tema disponivel</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-sm text-gray-600">
        Selecione os temas e configure as permissoes especificas para cada um:
      </div>

      {temas.map((tema) => {
        const temaPermissions = permissions.find((p) => p.tema === tema.slug);
        const isEnabled = !!temaPermissions;

        return (
          <div
            key={tema.id}
            className={`border-l-4 rounded-lg p-4 space-y-3 bg-white shadow-sm ${
              COR_CLASSES[tema.cor] || COR_CLASSES.gray
            }`}
          >
            {/* Header do tema */}
            <div className="flex items-center gap-3 pb-2 border-b">
              <Checkbox
                id={`tema-${tema.slug}`}
                checked={isEnabled}
                onCheckedChange={(checked) =>
                  handleTemaToggle(tema.slug, checked as boolean)
                }
              />
              <Label
                htmlFor={`tema-${tema.slug}`}
                className="text-lg font-semibold cursor-pointer"
              >
                {tema.nome}
              </Label>
            </div>

            {/* Grid de permissoes */}
            {isEnabled && temaPermissions && (
              <div className="grid grid-cols-2 gap-3 pl-6">
                {(Object.entries(PERMISSION_LABELS) as [keyof typeof PERMISSION_LABELS, string][]).map(
                  ([key, label]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Checkbox
                        id={`${tema.slug}-${key}`}
                        checked={temaPermissions[key]}
                        onCheckedChange={(checked) =>
                          handlePermissionChange(tema.slug, key, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={`${tema.slug}-${key}`}
                        className="text-sm cursor-pointer"
                      >
                        {label}
                      </Label>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
