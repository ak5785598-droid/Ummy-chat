'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ExternalLink, Film } from 'lucide-react';

interface MoviePlayerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tmdbId: number;
  title: string;
  posterPath?: string | null;
}

const PROVIDERS = [
  { id: 'vidlink', label: 'VidLink', url: (id: number) => `https://vidlink.pro/movie/${id}?primaryColor=B20710&secondaryColor=170000&iconColor=B20710&title=true&poster=true&autoplay=true` },
  { id: 'vidbinge', label: 'VidBinge', url: (id: number) => `https://www.vidbinge.to/movie/${id}` },
  { id: '2embed', label: '2embed', url: (id: number) => `https://www.2embed.cc/embed/${id}` },
];

const STORAGE_KEY = 'ummy-movie-provider';

function getPreferredProvider(): string {
  if (typeof window === 'undefined') return 'vidlink';
  return localStorage.getItem(STORAGE_KEY) || 'vidlink';
}

function setPreferredProvider(id: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, id);
}

export function MoviePlayer({ open, onOpenChange, tmdbId, title, posterPath }: MoviePlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [showProviders, setShowProviders] = useState(false);
  const [provider, setProvider] = useState(() => getPreferredProvider());
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentProvider = PROVIDERS.find(p => p.id === provider) || PROVIDERS[0];
  const videoUrl = currentProvider.url(tmdbId);

  useEffect(() => {
    if (open) {
      setIsLoading(true);
      setProvider(getPreferredProvider());
    }
  }, [open, tmdbId]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleProviderChange = useCallback((id: string) => {
    setProvider(id);
    setPreferredProvider(id);
    setShowProviders(false);
    setIsLoading(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowProviders(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenInBrowser = () => {
    window.open(videoUrl, '_blank');
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30"
            onClick={() => onOpenChange(false)}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50"
          >
            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm transition-all active:scale-90"
            >
              <X className="h-5 w-5 text-white" />
            </button>

            <div className="p-4 space-y-3 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center">
                    <Film className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">{title}</h3>
                    <p className="text-[10px] text-white/40">Movie Mirror</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOpenInBrowser}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 text-[10px] font-bold transition-all active:scale-95"
                    title="Open in external browser"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Browser
                  </button>
                  <div ref={dropdownRef} className="relative">
                    <button
                      onClick={() => setShowProviders(!showProviders)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 text-[10px] font-bold transition-all active:scale-95"
                    >
                      {currentProvider.label}
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    <AnimatePresence>
                      {showProviders && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="absolute right-0 top-full mt-1 w-32 bg-slate-800 rounded-xl border border-slate-700/50 shadow-xl overflow-hidden z-50"
                        >
                          {PROVIDERS.map((p) => (
                            <button
                              key={p.id}
                              onClick={() => handleProviderChange(p.id)}
                              className={`w-full px-3 py-2 text-left text-xs font-medium transition-colors ${
                                p.id === provider
                                  ? 'bg-purple-600/20 text-purple-400'
                                  : 'text-white/60 hover:bg-white/5 hover:text-white'
                              }`}
                            >
                              {p.label}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-8 w-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
                      <p className="text-xs text-white/50">Loading movie...</p>
                    </div>
                  </div>
                )}
                <iframe
                  ref={iframeRef}
                  key={`${provider}-${tmdbId}`}
                  src={videoUrl}
                  className="w-full h-full border-0"
                  allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                  allowFullScreen
                  onLoad={handleIframeLoad}
                />
              </div>

              <div className="flex items-center justify-center gap-2 text-[10px] text-white/30">
                <span>Provider: {currentProvider.label}</span>
                <span>•</span>
                <span>Ads? Use Browser button or switch provider</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
