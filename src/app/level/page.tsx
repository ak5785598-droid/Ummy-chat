'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, HelpCircle, User } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { calculateLevelProgress } from '@/lib/level-utils';
import { collection, query, orderBy } from 'firebase/firestore';

// ============ CANVAS BLACK REMOVER - SMART VERSION ============
// Ye function sirf tabhi black remove karega jab 4 corners black ho
function removeBlackBackgroundSmart(imageUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    // Cache check karo - har image ka apna unique cache
    const cacheKey = `smart_transparent_${btoa(imageUrl).slice(0, 50)}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      console.log('✅ Cache se mil gaya:', cacheKey.slice(0, 30));
      resolve(cached);
      return;
    }
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      
      if (!ctx) {
        console.log('❌ Context nahi mila, original image return');
        resolve(imageUrl);
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const width = canvas.width;
      const height = canvas.height;
      
      // ============ 4 CORNERS CHECK ============
      // Top-Left corner (0,0)
      const tl = getPixelColor(data, width, 0, 0);
      // Top-Right corner (width-1, 0)
      const tr = getPixelColor(data, width, width - 1, 0);
      // Bottom-Left corner (0, height-1)
      const bl = getPixelColor(data, width, 0, height - 1);
      // Bottom-Right corner (width-1, height-1)
      const br = getPixelColor(data, width, width - 1, height - 1);
      
      // Check karo ki 4 corners black hai ya nahi
      const isBlack = (color: {r: number, g: number, b: number}) => {
        return color.r < 40 && color.g < 40 && color.b < 40;
      };
      
      const allCornersBlack = isBlack(tl) && isBlack(tr) && isBlack(bl) && isBlack(br);
      
      console.log('🔍 Corner Check:', {
        tl: `rgb(${tl.r},${tl.g},${tl.b})`,
        tr: `rgb(${tr.r},${tr.g},${tr.b})`,
        bl: `rgb(${bl.r},${bl.g},${bl.b})`,
        br: `rgb(${br.r},${br.g},${br.b})`,
        allBlack: allCornersBlack
      });
      
      // Agar 4 corners black nahi hai toh original image return karo
      if (!allCornersBlack) {
        console.log('⚠️ 4 corners black nahi hai, background remove nahi hoga');
        sessionStorage.setItem(cacheKey, imageUrl);
        resolve(imageUrl);
        return;
      }
      
      console.log('✅ 4 corners black hai, background remove kar rahe hain');
      
      // ============ BACKGROUND REMOVE LOGIC ============
      const len = data.length;
      
      // Pehle edge pixels scan karo to find actual background color
      let bgR = 0, bgG = 0, bgB = 0, bgCount = 0;
      
      // Top edge scan
      for (let x = 0; x < width; x += 5) {
        const color = getPixelColor(data, width, x, 0);
        if (color.r < 50 && color.g < 50 && color.b < 50) {
          bgR += color.r;
          bgG += color.g;
          bgB += color.b;
          bgCount++;
        }
      }
      
      // Bottom edge scan
      for (let x = 0; x < width; x += 5) {
        const color = getPixelColor(data, width, x, height - 1);
        if (color.r < 50 && color.g < 50 && color.b < 50) {
          bgR += color.r;
          bgG += color.g;
          bgB += color.b;
          bgCount++;
        }
      }
      
      // Left edge scan
      for (let y = 0; y < height; y += 5) {
        const color = getPixelColor(data, width, 0, y);
        if (color.r < 50 && color.g < 50 && color.b < 50) {
          bgR += color.r;
          bgG += color.g;
          bgB += color.b;
          bgCount++;
        }
      }
      
      // Right edge scan
      for (let y = 0; y < height; y += 5) {
        const color = getPixelColor(data, width, width - 1, y);
        if (color.r < 50 && color.g < 50 && color.b < 50) {
          bgR += color.r;
          bgG += color.g;
          bgB += color.b;
          bgCount++;
        }
      }
      
      // Average background color calculate karo
      if (bgCount > 0) {
        bgR = Math.round(bgR / bgCount);
        bgG = Math.round(bgG / bgCount);
        bgB = Math.round(bgB / bgCount);
      } else {
        bgR = 0;
        bgG = 0;
        bgB = 0;
      }
      
      console.log(`🎨 Background color: rgb(${bgR},${bgG},${bgB})`);
      
      // Threshold set karo background color ke hisaab se
      const threshold = 60;
      
      // Saare pixels process karo
      for (let i = 0; i < len; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Check karo ki pixel background ke similar hai ya nahi
        const diffR = Math.abs(r - bgR);
        const diffG = Math.abs(g - bgG);
        const diffB = Math.abs(b - bgB);
        
        if (diffR < threshold && diffG < threshold && diffB < threshold) {
          // Background pixel hai - transparent banao
          data[i + 3] = 0;
        } else if (diffR < threshold + 30 && diffG < threshold + 30 && diffB < threshold + 30) {
          // Edge pixel - smooth alpha
          const maxDiff = Math.max(diffR, diffG, diffB);
          const alpha = ((maxDiff - threshold) / 30) * 255;
          data[i + 3] = Math.min(255, Math.max(0, alpha));
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      // Canvas ko blob mein convert karo
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          // Cache mein store karo
          try {
            sessionStorage.setItem(cacheKey, url);
            console.log('💾 Cache mein save kiya:', cacheKey.slice(0, 30));
          } catch(e) {
            console.log('⚠️ Cache full hai, save nahi kar paaye');
          }
          resolve(url);
        } else {
          console.log('❌ Blob create nahi hua');
          resolve(imageUrl);
        }
      }, 'image/png');
    };
    
    img.onerror = () => {
      console.log('❌ Image load nahi hui');
      resolve(imageUrl);
    };
    
    img.src = imageUrl;
  });
}

// Helper function - pixel color nikalne ke liye
function getPixelColor(data: Uint8ClampedArray, width: number, x: number, y: number) {
  const index = (y * width + x) * 4;
  return {
    r: data[index],
    g: data[index + 1],
    b: data[index + 2],
    a: data[index + 3]
  };
}

// ============ BULK PROCESSOR WITH UNIQUE IMAGE HANDLING ============
function useBulkImageProcessor(imageUrls: string[]) {
  // Har image ka apna processed URL store karo - Record use karo
  const [processedUrls, setProcessedUrls] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  
  useEffect(() => {
    if (!imageUrls.length) return;
    
    let cancelled = false;
    const processedMap: Record<string, string> = {};
    
    async function processAll() {
      setIsProcessing(true);
      console.log(`🔄 Processing ${imageUrls.length} images...`);
      
      // Har image ko alag-alag process karo
      for (const url of imageUrls) {
        if (!url || cancelled) continue;
        
        try {
          console.log(`📸 Processing: ${url.slice(0, 50)}...`);
          const processed = await removeBlackBackgroundSmart(url);
          processedMap[url] = processed;
          
          // Har image process hone ke baad state update karo
          if (!cancelled) {
            setProcessedUrls({ ...processedMap });
          }
        } catch (err) {
          console.log('❌ Error processing:', err);
          processedMap[url] = url; // Error case mein original URL use karo
        }
      }
      
      if (!cancelled) {
        console.log('✅ All images processed!');
        setIsProcessing(false);
      }
    }
    
    processAll();
    
    return () => {
      cancelled = true;
      // Cleanup - saare blob URLs revoke karo
      Object.values(processedUrls).forEach(url => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [imageUrls.join(',')]); // Stable reference
    
  return { processedUrls, isProcessing };
}

// ============ IMAGE COMPONENT ============
function SmartImage({ 
  imageUrl, 
  processedUrl, 
  alt,
  onLoad 
}: { 
  imageUrl: string; 
  processedUrl: string | null; 
  alt: string;
  onLoad?: () => void;
}) {
  const [hasError, setHasError] = useState(false);
  
  // Agar processed URL hai toh woh use karo, nahi toh original
  const displayUrl = processedUrl || imageUrl;
  
  if (!displayUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-transparent">
        <span className="text-[9px] text-gray-300">No Image</span>
      </div>
    );
  }
  
  return (
    <img 
      src={displayUrl} 
      alt={alt}
      className="w-full h-full object-contain p-1"
      loading="lazy"
      style={{ background: 'transparent' }}
      onLoad={() => {
        console.log(`✅ Image loaded: ${alt}`);
        if (onLoad) onLoad();
      }}
      onError={() => {
        console.log(`❌ Image error: ${alt}`);
        setHasError(true);
      }}
    />
  );
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

  // Saare unique image URLs collect karo
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
                  // Har level ka apna unique image URL
                  const imageUrl = level.imageUrl;
                  // Us URL ke liye processed version
                  const processedUrl = imageUrl ? processedUrls[imageUrl] : null;
                  
                  return (
                    <div 
                      key={level.id || idx} 
                      className="relative h-28 bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden hover:border-purple-400 hover:shadow-md transition-all duration-300"
                    >
                      {imageUrl ? (
                        <SmartImage 
                          imageUrl={imageUrl}
                          processedUrl={processedUrl}
                          alt={level.name || `Level ${idx}`}
                          onLoad={() => handleImageProcessed(imageUrl)}
                        />
                      ) : (
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
