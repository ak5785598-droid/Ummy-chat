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
      {/* Backdrop with enhanced room visibility (Lower blur, lower opacity) */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-[1px]"
        onClick={onClose}
      />
      
      {/* Game Modal - Pushed up to leave footer visible */}
      <div 
        className={cn(
          "relative bg-black rounded-3xl shadow-2xl border border-white/10 overflow-hidden transition-all duration-300 mb-[80px]",
          currentSize,
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative z-10 bg-gradient-to-b from-black/80 to-transparent p-4 flex items-center justify-between border-b border-white/5">
          <h2 className="text-lg font-black text-white uppercase italic tracking-tighter">
            {title}
          </h2>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="bg-white/10 p-1.5 rounded-full hover:bg-white/20 transition-all"
              title={isMaximized ? "Minimize" : "Maximize"}
            >
              {isMaximized ? <Minimize2 className="h-4 w-4 text-white" /> : <Maximize2 className="h-4 w-4 text-white" />}
            </button>
            
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="bg-white/10 p-1.5 rounded-full hover:bg-white/20 transition-all"
              title={isMinimized ? "Expand" : "Minimize"}
            >
              <div className="h-4 w-4 border-2 border-white rounded-sm" />
            </button>
            
            <button
              onClick={onClose}
              className="bg-red-500/20 p-1.5 rounded-full hover:bg-red-500/40 transition-all"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>

        {/* Game Content */}
        <div className={cn(
          "h-full overflow-hidden",
          isMinimized && "opacity-30"
        )}>
          {children}
        </div>

        {/* Room Visibility Indicator */}
        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-black text-white/60 uppercase">Room Active</span>
        </div>
      </div>
    </div>
  );
}
