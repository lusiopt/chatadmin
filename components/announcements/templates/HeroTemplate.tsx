'use client';

import { Attachment } from '../types';

interface HeroTemplateProps {
  title: string;
  content: string;
  attachments: Attachment[];
  temaName?: string;
  temaColor?: string;
}

export function HeroTemplate({ title, content, attachments, temaName, temaColor }: HeroTemplateProps) {
  // Encontrar primeira imagem nos attachments
  const heroImage = attachments.find(a => a.type === 'image');
  // Encontrar primeiro link nos attachments
  const linkAttachment = attachments.find(a => a.type === 'link');

  return (
    <div className="bg-white">
      {/* Hero Image */}
      {heroImage?.imageUrl ? (
        <div className="w-full h-40 bg-gray-200 relative overflow-hidden">
          <img
            src={heroImage.imageUrl}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      ) : (
        <div className="w-full h-40 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
          <svg className="w-12 h-12 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Tema badge */}
        {temaName && (
          <div className="mb-2">
            <span
              className="inline-block px-2 py-0.5 text-xs font-medium rounded-full text-white"
              style={{ backgroundColor: temaColor || '#6B7280' }}
            >
              {temaName}
            </span>
          </div>
        )}

        {/* Title */}
        <h2 className="text-lg font-semibold text-gray-900 mb-2 leading-tight">
          {title || 'Título do aviso'}
        </h2>

        {/* Content */}
        <p className="text-sm text-gray-600 leading-relaxed line-clamp-4">
          {content || 'O conteúdo do aviso aparecerá aqui...'}
        </p>

        {/* Link button */}
        {linkAttachment && (
          <div className="mt-4">
            <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-lg">
              {linkAttachment.title || 'Saiba mais'}
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
