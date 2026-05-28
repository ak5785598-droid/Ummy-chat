'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, HelpCircle, User } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { calculateLevelProgress } from '@/lib/level-utils';
import { collection, query, orderBy } from 'firebase/firestore';

// ============ CANVAS BLACK REMOVER - FAST ============
function removeBlackBackgroundFast(imageUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    // Cache bhi use karo - agar pehle process ho chuki hai
    const cacheKey = `transparent_${btoa(imageUrl).slice(0, 50)}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      resolve(cached);
      return;
    }
    
    img.onload = () => {
      // OffscreenCanvas for fast processing
      const canvas = typeof OffscreenCanvas !== 'undefined' 
        ? new OffscreenCanvas(img.width, img.height)
        : document.createElement('canvas');
      
      if (canvas instanceof OffscreenCanvas) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) { resolve(imageUrl); return; }
        
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const len = data.length;
        
        // Fast loop - direct access
        for (let i = 0; i < len; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Black pixel? Remove it
          if (r < 50 && g < 50 && b < 50) {
            data[i + 3] = 0;
          }
          // Near black? Smooth edge
          else if (r < 90 && g < 90 && b < 90) {
            const max = Math.max(r, g, b);
            data[i + 3] = (max / 90) * 255;
          }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        canvas.convertToBlob({ type: 'image/png' }).then(blob => {
          const url = URL.createObjectURL(blob);
          // Cache store karo
          try { sessionStorage.setItem(cacheKey, url); } catch(e) {}
          resolve(url);
        });
      } else {
        // Fallback to regular canvas
        const regularCanvas = canvas as HTMLCanvasElement;
        const ctx = regularCanvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) { resolve(imageUrl); return; }
        
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, regularCanvas.width, regularCanvas.height);
        const data = imageData.data;
        const len = data.length;
        
        for (let i = 0; i < len; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          if (r < 50 && g < 50 && b < 50) {
            data[i + 3] = 0;
          } else if (r < 90 && g < 90 && b < 90) {
            const max = Math.max(r, g, b);
            data[i + 3] = (max / 90) * 255;
          }
        }
        
        ctx.putImageData(imageData, 0, 0);
        const url = regularCanvas.toDataURL('image/png');
        try { sessionStorage.setItem(cacheKey, url); } catch(e) {}
        resolve(url);
      }
    };
    
    img.onerror = () => resolve(imageUrl);
    img.src = imageUrl;
  });
}

// ============ IMAGE COMPONENT WITH FAST PROCESSING ============
function FastTransparentImage({ imageUrl, alt }: { imageUrl: string; alt: string }) {
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    let mounted = true;
    
    async function process() {
      setIsLoading(true);
      const startTime = performance.now();
      
      const result = await removeBlackBackgroundFast(imageUrl);
      
      const endTime = performance.now();
      console.log(`⚡ Processed in ${(endTime - startTime).toFixed(0)}ms`);
      
      if (mounted) {
        setProcessedUrl(result);
        setIsLoading(false);
      }
    }
    
    process();
    
    return () => {
      mounted = false;
      // Cleanup blob URL
      if (processedUrl && processedUrl.startsWith('blob:')) {
        URL.revokeObjectURL(processedUrl);
      }
    };
  }, [imageUrl]);
  
  if (isLoading || !processedUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-transparent">
        <div className="flex flex-col items-center gap-1">
          <div className="w-6 h-6 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
          <span className="text-[9px] text-gray-400">processing...</span>
        </div>
      </div>
    );
  }
  
  return (
    <img 
      src={processedUrl} 
      alt={alt}
      className="w-full h-full object-contain"
      loading="lazy"
      style={{ background: 'transparent' }}
    />
  );
}

// ============ BULK PROCESSOR FOR ALL IMAGES ============
function useBulkImageProcessor(imageUrls: string[]) {
  const [processedUrls, setProcessedUrls] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  
  useEffect(() => {
    if (!imageUrls.length) return;
    
    let cancelled = false;
    
    async function processAll() {
      setIsProcessing(true);
      
      // Parallel processing - ek saath saari images
      const results = await Promise.all(
        imageUrls.map(async (url) => {
          if (!url) return { url, processed: null };
          const processed = await removeBlackBackgroundFast(url);
          return { url, processed };
        })
      );
      
      if (!cancelled) {
        const urlMap: Record<string, string> = {};
        results.forEach(({ url, processed }) => {
          if (processed) urlMap[url] = processed;
        });
        setProcessedUrls(urlMap);
        setIsProcessing(false);
      }
    }
    
    processAll();
    
    return () => { cancelled = true; };
  }, [imageUrls.join(',')]); // Stable reference
  
  return { processedUrls, isProcessing };
}

export default function UserLevelPage() {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { userProfile } = useUserProfile(user?.uid);
  
  const [showRules, setShowRules] = useState(false);
  const [imagesReady, setImagesReady] = useState<Record<string, boolean>>({});

  const stats = calculateLevelProgress(userProfile?.wallet?.totalSpent || 0);

  const levelsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "levels"), orderBy("updatedAt", "desc"));
  }, [firestore]);
  const { data: levels } = useCollection(levelsQuery);

  // Collect all image URLs for bulk processing
  const allImageUrls = levels?.map((l: any) => l.imageUrl).filter(Boolean) || [];
  const { processedUrls, isProcessing } = useBulkImageProcessor(allImageUrls);

  const handleImageProcessed = useCallback((url: string) => {
    setImagesReady(prev => ({ ...prev, [url]: true }));
  }, []);

  return (
    <AppLayout>
      {/* Light Theme Background with Purple Top */}
      <div className="relative min-h-screen bg-gray-50 font-sans pb-20 overflow-hidden text-gray-900">
        
        {/* Top 30vh Purple Glossy Effect mixing with White */}
        <div className="absolute top-0 left-0 w-full h-[30vh] bg-gradient-to-b from-purple-500/30 via-purple-400/15 to-transparent pointer-events-none blur-xl" />
        <div className="absolute top-0 left-0 w-full h-[30vh] bg-gradient-to-br from-purple-600/20 via-fuchsia-500/10 to-transparent pointer-events-none" />
        
        {/* Bottom Glossy Effects */}
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <header className="relative z-10 p-6 pt-safe flex items-center justify-between">
          <button 
            onClick={() => router.back()} 
            className="p-2 -ml-2 rounded-full transition-all duration-200 active:bg-gray-200 hover:bg-gray-100"
          >
            <ChevronLeft className="h-6 w-6 text-gray-800" />
          </button>
          <h1 className="text-xl font-bold uppercase tracking-[0.3em] text-center flex-1 -ml-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-700 via-fuchsia-600 to-purple-600">
            Levels
          </h1>
        </header>

        <div className="relative z-10 p-6 space-y-8">
          
          {/* User Profile Card - Glossy Solid Purple for Light Theme */}
          <div className="relative bg-gradient-to-br from-purple-600 via-fuchsia-500 to-purple-700 backdrop-blur-2xl border border-purple-400/50 rounded-2xl p-5 shadow-lg overflow-hidden">
            
            {/* Card ke andar glossy highlight */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-2xl pointer-events-none" />
            
            {/* User Info Section */}
            <div className="relative flex items-center gap-4 mb-5">
              {/* Profile Avatar */}
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-purple-200 to-white p-0.5 shadow-md">
                <div className="h-full w-full rounded-full overflow-hidden border-2 border-white/60">
                  {userProfile && 'photoURL' in userProfile && userProfile.photoURL ? (
                    <img 
                      src={userProfile.photoURL as string} 
                      alt="Profile" 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <User className="h-7 w-7 text-purple-500" />
                    </div>
                  )}
                </div>
              </div>
              
              {/* User Name */}
              <div>
                <p className="text-xs text-purple-100 tracking-wider">WELCOME BACK</p>
                <h2 className="text-lg font-bold text-white tracking-wide">
                  {userProfile && 'name' in userProfile ? (userProfile.name as string) : 'Username'}
                </h2>
              </div>
            </div>

            {/* Progress Bar Section */}
            <div className="relative space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2.5 bg-black/20 rounded-full overflow-hidden shadow-inner border border-white/10">
                  <div 
                    className="h-full bg-gradient-to-r from-white via-purple-100 to-white rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(255,255,255,0.8)]" 
                    style={{ width: `${stats.progressPercent}%` }} 
                  />
                </div>
                <span className="text-sm font-bold text-white whitespace-nowrap drop-shadow-md">
                  Lv.{stats.currentLevel}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-purple-100 tracking-wide">
                  Need <span className="text-white font-bold">{stats.remainingToLevelUp.toLocaleString()}</span> Exp For Lv.{stats.nextLevel}
                </span>
                <button 
                  onClick={() => setShowRules(true)} 
                  className="p-1.5 rounded-full active:scale-95 transition-all duration-200 hover:bg-white/20"
                >
                  <HelpCircle className="h-5 w-5 text-yellow-300 drop-shadow-sm" />
                </button>
              </div>
            </div>
          </div>

          {/* Budget Section */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold tracking-[0.2em] text-gray-800 uppercase">
                Budget
              </h2>
              {isProcessing && (
                <span className="text-[10px] text-purple-500 animate-pulse">
                  Processing images...
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {levels && levels.length > 0 ? (
                levels.map((level: any, idx: number) => {
                  const hasImage = level.imageUrl && processedUrls[level.imageUrl];
                  
                  return (
                    <div 
                      key={level.id || idx} 
                      className="relative h-28 bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden hover:border-purple-400 hover:shadow-md transition-all duration-300"
                    >
                      {/* Transparent image dikhao agar processed hai */}
                      {hasImage ? (
                        <img 
                          src={processedUrls[level.imageUrl]} 
                          alt={level.name || `Level ${idx}`}
                          className="w-full h-full object-contain p-1"
                          loading="lazy"
                          style={{ background: 'transparent' }}
                          onLoad={() => handleImageProcessed(level.imageUrl)}
                        />
                      ) : level.imageUrl ? (
                        // Processing mein hai toh skeleton dikhao
                        <div className="w-full h-full flex items-center justify-center bg-transparent">
                          <div className="w-5 h-5 border-2 border-purple-200 border-t-purple-400 rounded-full animate-spin" />
                        </div>
                      ) : (
                        // No image
                        <div className="w-full h-full flex items-center justify-center bg-transparent">
                          <span className="text-[9px] text-gray-300">No Image</span>
                        </div>
                      )}
                      
                      {/* Level label */}
                      <span className="absolute bottom-2 left-2 text-[10px] font-bold text-white tracking-wider bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full z-10">
                        {level.range || `Lv.${idx}`}
                      </span>
                    </div>
                  );
                })
              ) : (
                // Fallback static data
                [
                  'Lv.0 - Lv.10',
                  'Lv.20 - Lv.35',
                  'Lv.40 - Lv.56',
                  'Lv.63 - Lv.75',
                  'Lv.78 - Lv.87',
                  'Lv.88 - Lv.99'
                ].map((range, idx) => (
                  <div 
                    key={idx} 
                    className="relative h-28 bg-white border border-gray-200 shadow-sm rounded-xl p-3 flex flex-col justify-start hover:border-purple-400 hover:shadow-md transition-all duration-300"
                  >
                    <span className="text-[10px] font-bold text-gray-500 tracking-wider">
                      {range}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Rewards Section */}
          <div className="space-y-4 pt-4">
            <h2 className="text-lg font-bold tracking-[0.2em] text-gray-800 uppercase">Rewards</h2>
            
            <div className="grid grid-cols-3 gap-3">
              {[
                'Lv.0 - Lv.10',
                'Lv.20 - Lv.35',
                'Lv.40 - Lv.56',
                'Lv.63 - Lv.75',
                'Lv.78 - Lv.87',
                'Lv.88 - Lv.99'
              ].map((range, idx) => (
                <div 
                  key={idx} 
                  className="relative h-28 bg-white border border-gray-200 shadow-sm rounded-xl p-3 flex flex-col justify-start hover:border-purple-400 hover:shadow-md transition-all duration-300"
                >
                  <span className="text-[10px] font-bold text-gray-500 tracking-wider">
                    {range}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Frames Section */}
          <div className="space-y-4 pt-4">
            <h2 className="text-lg font-bold tracking-[0.2em] text-gray-800 uppercase">Frames</h2>
            
            <div className="grid grid-cols-3 gap-3">
              {[
                'Lv.0 - Lv.10',
                'Lv.20 - Lv.35',
                'Lv.40 - Lv.56',
                'Lv.63 - Lv.75',
                'Lv.78 - Lv.87',
                'Lv.88 - Lv.99'
              ].map((range, idx) => (
                <div 
                  key={idx} 
                  className="relative h-28 bg-white border border-gray-200 shadow-sm rounded-xl p-3 flex flex-col justify-start hover:border-purple-400 hover:shadow-md transition-all duration-300"
                >
                  <span className="text-[10px] font-bold text-gray-500 tracking-wider">
                    {range}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Rules Modal - Updated for Light Theme */}
        {showRules && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-white border border-purple-200 shadow-2xl rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              
              <div className="p-4 border-b border-gray-100 flex items-center bg-gradient-to-r from-purple-50 to-transparent">
                <button 
                  onClick={() => setShowRules(false)} 
                  className="p-1 -ml-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft className="h-6 w-6 text-gray-800" />
                </button>
                <h2 className="text-lg font-bold flex-1 text-center -ml-6 bg-gradient-to-r from-purple-700 to-fuchsia-600 bg-clip-text text-transparent">
                  Rules
                </h2>
              </div>

              <div className="p-5 max-h-[60vh] overflow-y-auto space-y-5 text-gray-800">
                
                <div className="space-y-2">
                  <h3 className="text-sm text-purple-700 font-bold">Gift coins consumption</h3>
                  <p className="text-xs text-amber-600 font-semibold">5 coins = 1 Exp</p>
                  <div className="bg-amber-50 text-amber-700 text-[11px] p-2.5 rounded-lg border border-amber-200">
                    Svip2 privilege: 5coins = 1.2EXP
                  </div>
                  <div className="bg-amber-50 text-amber-700 text-[11px] p-2.5 rounded-lg border border-amber-200">
                    Svip7 privilege: 5coins = 1.3EXP
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm text-purple-700 font-bold">Enter the room</h3>
                  <p className="text-xs text-amber-600 font-semibold">2000 Exp/day</p>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm text-purple-700 font-bold">Share the room</h3>
                  <p className="text-xs text-amber-600 font-semibold">2000 Exp/day</p>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm text-purple-700 font-bold">Stay in your own room (Limited Time)</h3>
                  <p className="text-xs text-amber-600 font-semibold">10mins = 1000 Exp, 10000Exp/day</p>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm text-purple-700 font-bold">Stay on other rooms (Limited Time)</h3>
                  <p className="text-xs text-amber-600 font-semibold">10mins = 1000 Exp, 20000 Exp/day</p>
                </div>

                <div className="space-y-1 pb-4">
                  <h3 className="text-sm text-purple-700 font-bold">Participate in activities</h3>
                  <p className="text-xs text-amber-600 font-semibold">Speed up upgrade</p>
                </div>

              </div>
            </div>
          </div>
        )}
        
      </div>
    </AppLayout>
  );
        }
