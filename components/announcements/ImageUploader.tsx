'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

interface ImageUploaderProps {
  onUpload: (imageUrl: string, thumbUrl?: string) => void;
  currentImage?: string;
  onRemove?: () => void;
}

type UploadState = 'idle' | 'uploading' | 'success' | 'error';

export function ImageUploader({ onUpload, currentImage, onRemove }: ImageUploaderProps) {
  const [state, setState] = useState<UploadState>(currentImage ? 'success' : 'idle');
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    // Validar se é imagem (qualquer tipo)
    if (!file.type.startsWith('image/')) {
      setError('O arquivo deve ser uma imagem');
      setState('error');
      return;
    }

    // Validar tamanho (max 10MB - limite do Stream)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Arquivo muito grande. Máximo: 10MB');
      setState('error');
      return;
    }

    // Mostrar preview local enquanto faz upload
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setState('uploading');
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // NÃO definir Content-Type manualmente - axios define automaticamente com boundary correto
      const { data } = await api.post('/api/upload/image', formData);

      setState('success');
      setPreview(data.file);
      onUpload(data.file, data.thumbUrl);

    } catch (err: any) {
      console.error('Erro no upload:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Erro ao fazer upload';
      setError(errorMessage);
      setState('error');
      setPreview(null);
    } finally {
      // Limpar preview local
      URL.revokeObjectURL(localPreview);
    }
  }, [onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleRemove = useCallback(() => {
    setPreview(null);
    setState('idle');
    setError(null);
    onRemove?.();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onRemove]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Se tem imagem, mostrar preview
  if (state === 'success' && preview) {
    return (
      <div className="relative rounded-lg overflow-hidden border border-gray-200">
        <img
          src={preview}
          alt="Preview"
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-2 right-2 flex gap-2">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="h-8 w-8 bg-white/90 hover:bg-white"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
          Imagem carregada
        </div>
      </div>
    );
  }

  // Se está fazendo upload
  if (state === 'uploading') {
    return (
      <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center bg-blue-50">
        {preview && (
          <img
            src={preview}
            alt="Preview"
            className="w-full h-32 object-cover rounded-lg mb-4 opacity-50"
          />
        )}
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
        <p className="text-sm text-blue-600">Enviando imagem...</p>
      </div>
    );
  }

  // Se teve erro
  if (state === 'error') {
    return (
      <div className="border-2 border-dashed border-red-300 rounded-lg p-8 text-center bg-red-50">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <p className="text-sm text-red-600 mb-3">{error}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setState('idle');
            setError(null);
          }}
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  // Estado inicial - área de drop
  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
        isDragging
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />

      <div className="flex flex-col items-center gap-2">
        {isDragging ? (
          <>
            <Upload className="h-10 w-10 text-blue-500" />
            <p className="text-sm text-blue-600 font-medium">Solte a imagem aqui</p>
          </>
        ) : (
          <>
            <ImageIcon className="h-10 w-10 text-gray-400" />
            <p className="text-sm text-gray-600">
              <span className="font-medium text-blue-600">Clique para selecionar</span>
              {' '}ou arraste uma imagem
            </p>
            <p className="text-xs text-gray-400">Qualquer formato de imagem (max 10MB)</p>
          </>
        )}
      </div>
    </div>
  );
}
