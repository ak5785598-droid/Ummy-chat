'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader, ExternalLink, Play, Smartphone, Globe } from 'lucide-react';
import { InAppBrowser } from '@capacitor/inappbrowser';

interface NetMirrorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isHost: boolean;
}

const NETMIRROR_URL = 'https://netmirror.gg';

// Desktop User-Agent to bypass mobile detection (for WebView fallback)
const DESKTOP_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export function NetMirrorDialog({ open, onOpenChange, isHost }: NetMirrorDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // PRIMARY: System Browser (Chrome Custom Tabs) - Cloudflare trusted
  const handleOpenNetMirror = async () => {
    try {
      setIsOpen(true);
      setError(null);
      
      await InAppBrowser.openInSystemBrowser({
        url: NETMIRROR_URL,
        options: {
          android: {
            showTitle: true,
            hideToolbarOnScroll: false,
            viewStyle: 1, // FULL_SCREEN
            startAnimation: 0, // FADE_IN
            exitAnimation: 1, // FADE_OUT
          },
          iOS: {
            closeButtonText: 2, // DONE
            viewStyle: 2, // FULL_SCREEN
            animationEffect: 2, // COVER_VERTICAL
            enableBarsCollapsing: true,
            enableReadersMode: false,
          },
        },
      });
      
      InAppBrowser.addListener('browserClosed', () => {
        setIsOpen(false);
      });

      // Cloudflare detection
      InAppBrowser.addListener('browserPageNavigationCompleted', (data) => {
        if (data.url?.includes('cloudflare') || data.url?.includes('security')) {
          setError('Cloudflare verification detected. If stuck, try "Try In-App Browser" or "Open in External Browser"');
        }
      });
    } catch (err: any) {
      console.error('[NetMirror] Failed to open System Browser:', err);
      setError('Failed to open NetMirror. Please try another option.');
      setIsOpen(false);
    }
  };

  // SECONDARY: WebView with desktop User-Agent - fallback
  const handleOpenInAppBrowser = async () => {
    try {
      setIsOpen(true);
      setError(null);
      
      await InAppBrowser.openInWebView({
        url: NETMIRROR_URL,
        options: {
          showURL: false,
          showToolbar: true,
          clearCache: false,
          clearSessionCache: false,
          mediaPlaybackRequiresUserAction: false,
          closeButtonText: 'Done',
          toolbarPosition: 0,
          showNavigationButtons: true,
          leftToRight: false,
          customWebViewUserAgent: DESKTOP_USER_AGENT,
          android: {
            allowZoom: false,
            hardwareBack: true,
            pauseMedia: false,
          },
          iOS: {
            allowOverScroll: false,
            enableViewportScale: true,
            allowInLineMediaPlayback: true,
            surpressIncrementalRendering: false,
            viewStyle: 2,
            animationEffect: 2,
            allowsBackForwardNavigationGestures: true,
          },
        },
      });
      
      InAppBrowser.addListener('browserClosed', () => {
        setIsOpen(false);
      });
    } catch (err: any) {
      console.error('[NetMirror] Failed to open WebView:', err);
      setError('Failed to open NetMirror. Please try another option.');
      setIsOpen(false);
    }
  };

  // TERTIARY: External Browser - ultimate fallback
  const handleOpenExternal = async () => {
    try {
      await InAppBrowser.openInExternalBrowser({
        url: NETMIRROR_URL,
      });
    } catch (err) {
      console.error('[NetMirror] Failed to open external browser:', err);
      window.open(NETMIRROR_URL, '_blank');
    }
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
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />
          
          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50"
          >
            {/* Close Button */}
            <button 
              onClick={() => onOpenChange(false)}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm transition-all active:scale-90"
            >
              <X className="h-5 w-5 text-white" />
            </button>

            {/* Content */}
            <div className="p-6 flex flex-col items-center text-center space-y-5">
              {/* Logo */}
              <div className="h-16 w-16 rounded-2xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/30">
                <svg viewBox="0 0 24 24" className="h-10 w-10 text-white" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 3H8L16 13V3H19V21H16L8 11V21H5V3Z" fill="currentColor"/>
                </svg>
              </div>

              {/* Title */}
              <div>
                <h2 className="text-xl font-bold text-white">NetMirror</h2>
                <p className="text-sm text-slate-400 mt-1">Movies & Series Streaming</p>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-500 leading-relaxed">
                Watch thousands of movies and TV series with original audio and HD quality.
                Sign in with Google to start watching.
              </p>

              {/* Error Message */}
              {error && (
                <div className="w-full p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-400">
                  {error}
                </div>
              )}

              {/* Buttons */}
              <div className="w-full space-y-3 pt-2">
                {/* Primary Button - System Browser (Recommended) */}
                <button
                  onClick={handleOpenNetMirror}
                  disabled={isOpen}
                  className="w-full py-3.5 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 rounded-xl text-white font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-red-600/20"
                >
                  {isOpen ? (
                    <>
                      <Loader className="h-5 w-5 animate-spin" />
                      Opening...
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5" />
                      Open NetMirror
                    </>
                  )}
                </button>
                <p className="text-[10px] text-slate-500 -mt-2">Recommended • Cloudflare verification works</p>

                {/* Secondary Button - WebView (Fallback) */}
                <button
                  onClick={handleOpenInAppBrowser}
                  disabled={isOpen}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800/50 rounded-xl text-slate-300 font-medium text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Smartphone className="h-4 w-4" />
                  Try In-App Browser
                </button>
                <p className="text-[10px] text-slate-500 -mt-2">If above doesn't work • Desktop mode</p>

                {/* Tertiary Button - External Browser (Ultimate Fallback) */}
                <button
                  onClick={handleOpenExternal}
                  className="w-full py-3 bg-slate-800/50 hover:bg-slate-800 rounded-xl text-slate-400 font-medium text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Globe className="h-4 w-4" />
                  Open in External Browser
                </button>
                <p className="text-[10px] text-slate-600 -mt-2">Opens in Chrome app • Always works</p>
              </div>

              {/* Warning Box */}
              <div className="w-full p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  <span className="text-amber-400 font-bold">⚠️ Note:</span> If you see "Verify you are human" and it's stuck, use <span className="text-white font-medium">"Open in External Browser"</span> option.
                </p>
              </div>

              {/* Info */}
              <div className="pt-2 space-y-2">
                <div className="flex items-start gap-2 text-[11px] text-slate-500">
                  <span className="text-red-400 mt-0.5">•</span>
                  <p>Google Sign-In supported</p>
                </div>
                <div className="flex items-start gap-2 text-[11px] text-slate-500">
                  <span className="text-red-400 mt-0.5">•</span>
                  <p>HD streaming with original audio</p>
                </div>
                <div className="flex items-start gap-2 text-[11px] text-slate-500">
                  <span className="text-red-400 mt-0.5">•</span>
                  <p>50+ OTT apps and sites</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
