'use client';

import { useState } from 'react';
import { Upload, X, User } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

interface AvatarUploadProps {
  value?: string;
  onChange: (url: string) => void;
  userId?: string;
}

export function AvatarUpload({ value, onChange, userId }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validações client-side
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Formato inválido. Use JPG, PNG ou WebP');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Arquivo muito grande. Máximo 5MB');
      return;
    }

    setUploading(true);

    try {
      // Preview local
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);

      // Upload para Supabase
      const formData = new FormData();
      formData.append('file', file);
      if (userId) formData.append('userId', userId);

      const { data } = await api.post('/api/upload/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      onChange(data.url);
    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Erro ao fazer upload do avatar');
      setPreview(value || null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange('');
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-gray-200">
        {preview ? (
          <>
            <Image
              src={preview}
              alt="Avatar"
              fill
              className="object-cover"
            />
            <button
              onClick={handleRemove}
              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <User className="w-16 h-16 text-gray-400" />
        )}
      </div>

      <label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
        >
          <Upload className="w-4 h-4 mr-2" />
          {uploading ? 'Enviando...' : 'Escolher Avatar'}
        </Button>
      </label>

      <p className="text-xs text-gray-500 text-center">
        JPG, PNG ou WebP. Máximo 5MB
      </p>
    </div>
  );
}
