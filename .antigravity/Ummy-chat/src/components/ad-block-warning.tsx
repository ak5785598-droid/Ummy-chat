'use client';

import { useState, useEffect } from 'react';
import { ShieldAlert, X } from 'lucide-react';

/**
 * High-Fidelity Ad Blocker & Network Restriction Detector.
 * Specifically monitors for ERR_BLOCKED_BY_CLIENT events affecting Firebase frequencies.
 */
export function AdBlockWarning() {
 const [isBlocked, setIsBlocked] = useState(false);
 const [dismissed, setDismissed] = useState(false);

 useEffect(() => {
  // Proactive Connectivity Handshake
  const checkConnectivity = async () => {
   try {
    // Attempt to ping a common Firebase domain often targeted by blockers.
    // mode: 'no-cors' ensures we don't get a CORS error, but fetch will still throw
    // if the request is blocked by the browser/client (TypeError).
    await fetch('https://firestore.googleapis.com/static/err.html', { 
     mode: 'no-cors', 
     cache: 'no-store'
    });
   } catch (err) {
    // TypeError indicates the request was blocked or network is down.
    // In the context of a social app, this is usually an Ad Blocker.
    console.warn('[Network Sync] Firebase frequency blocked by client. Ad blocker may be active.');
    setIsBlocked(true);
   }
  };

  // Delay check slightly to allow initial sync to attempt connection
  const timer = setTimeout(checkConnectivity, 3000);
  return () => clearTimeout(timer);
 }, []);

 if (!isBlocked || dismissed) return null;

 return (
  <div className="fixed top-6 left-4 right-4 z-[9999] animate-in slide-in-from-top-10 duration-700 font-sans">
   <div className="bg-red-600 text-white rounded-3xl p-5 shadow-[0_20px_50px_rgba(220,38,38,0.4)] border-2 border-white/20 flex items-center justify-between gap-4 relative overflow-hidden">
    {/* Visual Shine Engine */}
    <div className="absolute inset-0 bg-white/10 skew-x-[-30deg] -translate-x-[200%] animate-shine pointer-events-none" />
    
    <div className="flex items-center gap-4 relative z-10">
      <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
       <ShieldAlert className="h-7 w-7 text-white" />
      </div>
      <div className="space-y-0.5">
       <h4 className="font-bold uppercase tracking-tight text-lg leading-tight">Frequency Blocked</h4>
       <p className="text-[13px] font-bold opacity-90 leading-tight">
        Please disable ad blocker or use Chrome.
       </p>
      </div>
    </div>

    <button 
     onClick={() => setDismissed(true)}
     className="p-2 hover:bg-white/10 rounded-full transition-colors relative z-10"
    >
      <X className="h-5 w-5 text-white/60" />
    </button>
   </div>
  </div>
 );
}
