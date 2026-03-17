'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * High-Fidelity PWA Install Portal Component.
 * Synchronizes with the browser's beforeinstallprompt frequency.
 */
export function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      console.log('[PWA Sync] Install prompt detected.');
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA Sync] User choice: ${outcome}`);
    
    setDeferredPrompt(null);
    setShow(false);
  };

  if (!show) return null;

  return (
    <button
      onClick={installApp}
      className={cn(
        "fixed bottom-24 right-6 z-[9999]",
        "bg-[#FFCC00] text-black font-black uppercase italic text-[10px]",
        "px-6 py-3 rounded-full shadow-[0_0_30px_rgba(255,204,0,0.4)] border-2 border-white",
        "animate-in slide-in-from-right-full duration-700",
        "flex items-center gap-2 active:scale-95 transition-transform"
      )}
    >
      <Download className="h-3 w-3" strokeWidth={3} />
      Install App
    </button>
  );
}
