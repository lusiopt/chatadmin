'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const TEMAS = ['Cartões', 'Milhas', 'Network'] as const;

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

export function PermissionGrid({ permissions, onChange }: PermissionGridProps) {
  const handleTemaToggle = (tema: string, enabled: boolean) => {
    if (enabled) {
      // Adicionar tema com permissões padrão
      onChange([
        ...permissions,
        {
          tema,
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
      onChange(permissions.filter((p) => p.tema !== tema));
    }
  };

  const handlePermissionChange = (
    tema: string,
    permission: keyof Omit<TemaPermissions, 'tema'>,
    value: boolean
  ) => {
    onChange(
      permissions.map((p) =>
        p.tema === tema ? { ...p, [permission]: value } : p
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-sm text-gray-600">
        Selecione os temas e configure as permissões específicas para cada um:
      </div>

      {TEMAS.map((tema) => {
        const temaPermissions = permissions.find((p) => p.tema === tema);
        const isEnabled = !!temaPermissions;

        return (
          <div
            key={tema}
            className="border rounded-lg p-4 space-y-3"
          >
            {/* Header do tema */}
            <div className="flex items-center gap-3 pb-2 border-b">
              <Checkbox
                id={`tema-${tema}`}
                checked={isEnabled}
                onCheckedChange={(checked) =>
                  handleTemaToggle(tema, checked as boolean)
                }
              />
              <Label
                htmlFor={`tema-${tema}`}
                className="text-lg font-semibold cursor-pointer"
              >
                {tema}
              </Label>
            </div>

            {/* Grid de permissões */}
            {isEnabled && temaPermissions && (
              <div className="grid grid-cols-2 gap-3 pl-6">
                {(Object.entries(PERMISSION_LABELS) as [keyof typeof PERMISSION_LABELS, string][]).map(
                  ([key, label]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Checkbox
                        id={`${tema}-${key}`}
                        checked={temaPermissions[key]}
                        onCheckedChange={(checked) =>
                          handlePermissionChange(tema, key, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={`${tema}-${key}`}
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
