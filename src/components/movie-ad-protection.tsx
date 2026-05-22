'use client';

import { useEffect, useRef } from 'react';

interface MovieAdProtectionProps {
  isOpen: boolean;
  videoUrl: string;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  onAdBlocked: () => void;
}

export function MovieAdProtection({ isOpen, videoUrl, iframeRef, onAdBlocked }: MovieAdProtectionProps) {
  const originalUrlRef = useRef(videoUrl);
  const popupBlockedRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      originalUrlRef.current = videoUrl;
      popupBlockedRef.current = false;
    }
  }, [isOpen, videoUrl]);

  useEffect(() => {
    if (!isOpen) return;

    const originalOpen = window.open;
    window.open = function (...args: Parameters<typeof window.open>) {
      popupBlockedRef.current = true;
      onAdBlocked();
      return null;
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (originalUrlRef.current) {
        e.preventDefault();
        e.returnValue = '';
        if (iframeRef.current) {
          iframeRef.current.src = originalUrlRef.current;
        }
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.open = originalOpen;
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isOpen, onAdBlocked, iframeRef]);

  useEffect(() => {
    if (!isOpen) return;

    const checkInterval = setInterval(() => {
      const iframe = iframeRef.current;
      if (!iframe) return;

      try {
        const currentSrc = iframe.src;
        const original = originalUrlRef.current;
        if (original && currentSrc !== original && !currentSrc.includes('vidlink.pro')) {
          iframe.src = original;
          onAdBlocked();
        }
      } catch {
        if (iframeRef.current && originalUrlRef.current) {
          iframeRef.current.src = originalUrlRef.current;
          onAdBlocked();
        }
      }
    }, 2000);

    return () => clearInterval(checkInterval);
  }, [isOpen, onAdBlocked, iframeRef]);

  return null;
}
