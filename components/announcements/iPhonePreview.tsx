'use client';

import { ReactNode } from 'react';

interface iPhonePreviewProps {
  children: ReactNode;
}

export function IPhonePreview({ children }: iPhonePreviewProps) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-xs text-gray-500 mb-2">Preview iOS</span>

      {/* iPhone Frame */}
      <div className="relative">
        {/* Outer frame */}
        <div
          className="bg-gray-900 rounded-[3rem] p-3 shadow-xl"
          style={{ width: '280px' }}
        >
          {/* Dynamic Island */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-black rounded-full z-10" />

          {/* Screen */}
          <div
            className="bg-white rounded-[2.5rem] overflow-hidden relative"
            style={{ height: '560px' }}
          >
            {/* Status Bar */}
            <div className="h-12 bg-gray-50 flex items-end justify-between px-8 pb-1">
              <span className="text-xs font-semibold">9:41</span>
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3C8.5 3 5.5 4.5 3.5 7L12 21l8.5-14C18.5 4.5 15.5 3 12 3z" />
                </svg>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2 17h20v2H2v-2zm0-4h20v2H2v-2zm0-4h20v2H2V9zm0-4h20v2H2V5z" />
                </svg>
                <div className="w-6 h-3 border border-gray-800 rounded-sm relative">
                  <div className="absolute inset-0.5 bg-gray-800 rounded-sm" style={{ width: '70%' }} />
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="h-[calc(100%-48px)] overflow-y-auto">
              {children}
            </div>
          </div>
        </div>

        {/* Home Indicator */}
        <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gray-800 rounded-full" />
      </div>
    </div>
  );
}
