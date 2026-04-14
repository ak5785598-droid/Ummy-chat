'use client';

import React, { useEffect, useState } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GameModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
  className?: string;
}

export function GameModal({ isOpen, onClose, children, title, className }: GameModalProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalSizes = {
    default: "w-[95vw] h-[60vh] max-w-4xl",
    maximized: "w-[98vw] h-[95vh] max-w-none",
    minimized: "w-[400px] h-[300px]"
  };

  const currentSize = isMaximized ? modalSizes.maximized : isMinimized ? modalSizes.minimized : modalSizes.default;

  return (
    <div className="fixed inset-0 z-[999] flex items-end justify-center p-4 pointer-events-none">
      {/* Backdrop - 100% CLEAR Room visibility */}
      <div 
        className="absolute inset-0 bg-transparent pointer-events-auto"
        onClick={onClose}
      />
      
      {/* Game Modal - Pushed up to leave footer visible */}
      <div 
        className={cn(
          "relative bg-[#0c0c14] rounded-t-[3rem] shadow-[0_-20px_50px_rgba(0,0,0,0.8)] border-t border-white/10 overflow-hidden transition-all duration-300 mb-[80px] pointer-events-auto",
          currentSize,
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >

        {/* Game Content */}
        <div className={cn(
          "h-full overflow-hidden",
          isMinimized && "opacity-30"
        )}>
          {children}
        </div>

        {/* Room Visibility Indicator */}
        <div className="absolute bottom-4 left-4 bg-black/80 px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-black text-white/60 uppercase">Room Active</span>
        </div>
      </div>
    </div>
  );
}
