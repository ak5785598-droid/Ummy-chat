'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc, updateDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { AppLayout } from '@/components/layout/app-layout';
import { getOptimizedMediaUrl } from '@/lib/media-proxy';
import {
  ChevronLeft,
  Plus,
  Heart,
  HelpCircle,
  X,
  Lock,
  Handshake,
  Wrench,
  RotateCw,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  ChevronLeft as ChevronLeftIcon,
  Save,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { collection, query, where, limit, doc, serverTimestamp } from 'firebase/firestore';
import { CPProposeDialog } from '@/components/cp-propose-dialog';
import { UserSearchDialog } from '@/components/user-search-dialog';
import { FURNITURE_CATALOG, FurnitureItem } from '@/constants/cp-furniture-catalog';
import { useToast } from '@/hooks/use-toast';

interface PlacedItem {
  id: string;
  catalogId: string;
  x: number;
  y: number;
  rotation: 0 | 90 | 180 | 270;
}

export default function CpHousePage() {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { userProfile } = useUserProfile(user?.uid);
  
  const [isMounted, setIsMounted] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState<'cp' | 'friend'>('cp');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<any>(null);
  const [showPropose, setShowPropose] = useState(false);

  // Mansion Editor states
  const [isEditMode, setIsEditMode] = useState(false);
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);
  const [selectedItemIdx, setSelectedItemIdx] = useState<number | null>(null);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [savingMansion, setSavingMansion] = useState(false);

  const configRef = useMemoFirebase(() => !firestore ? null : doc(firestore, 'appConfig', 'global'), [firestore]);
  const { data: config } = useDoc(configRef);
  const cpHeaderTheme = config?.cpHeaderTheme || '#FF91B5';

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const cpQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'cpPairs'), where('participantIds', 'array-contains', user.uid), limit(1));
  }, [firestore, user?.uid]);

  const { data: cpData } = useCollection(cpQuery);
  const activeCp = cpData?.[0];
  const partnerUid = activeCp?.participantIds?.find((id: string) => id !== user?.uid);
  const { userProfile: partnerProfile } = useUserProfile(partnerUid);

  // Sync mansion layout from Firestore on load
  useEffect(() => {
    if (activeCp?.mansionLayout) {
      setPlacedItems(activeCp.mansionLayout);
    } else {
      setPlacedItems([]);
    }
  }, [activeCp]);

  // Get background image URL based on active tab
  const backgroundImageUrl = useMemo(() => {
    if (activeMainTab === 'cp' && config?.cpBgType === 'image' && config?.cpBgUrl) {
      return getOptimizedMediaUrl(config.cpBgUrl);
    }
    if (activeMainTab === 'friend' && config?.friendBgType === 'image' && config?.friendBgUrl) {
      return getOptimizedMediaUrl(config.friendBgUrl);
    }
    return null;
  }, [activeMainTab, config]);

  const handleProposeTarget = (target: any) => {
    setSelectedTarget(target);
    setShowSearch(false);
    setShowPropose(true);
  };

  // --- MANSION EDITOR CONTROLS ---
  const handlePlaceItem = (catalogId: string) => {
    const catalogItem = FURNITURE_CATALOG.find(item => item.id === catalogId);
    if (!catalogItem) return;

    const cpLevel = activeCp?.level || 1;
    if (cpLevel < catalogItem.unlockLevel) {
      toast({
        variant: 'destructive',
        title: 'Item Locked',
        description: `Unlock this item by reaching CP Level ${catalogItem.unlockLevel}!`
      });
      return;
    }

    if (catalogItem.price > 0 && (userProfile?.wallet?.coins || 0) < catalogItem.price) {
      toast({
        variant: 'destructive',
        title: 'Insufficient Coins',
        description: `You need ${catalogItem.price} coins to buy this item.`
      });
      return;
    }

    const newItem: PlacedItem = {
      id: `${catalogId}_${Date.now()}`,
      catalogId,
      x: 2,
      y: 2,
      rotation: 0
    };

    setPlacedItems(prev => [...prev, newItem]);
    setSelectedItemIdx(placedItems.length);
    setIsCatalogOpen(false);
    
    toast({
      title: 'Placed Item',
      description: `${catalogItem.name} added to room. Adjust it and click Save!`
    });
  };

  const handleMoveItem = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (selectedItemIdx === null) return;
    setPlacedItems(prev => prev.map((item, idx) => {
      if (idx !== selectedItemIdx) return item;
      let { x, y } = item;
      if (direction === 'up' && x > 0) x -= 1;
      if (direction === 'down' && x < 4) x += 1;
      if (direction === 'left' && y > 0) y -= 1;
      if (direction === 'right' && y < 4) y += 1;
      return { ...item, x, y };
    }));
  };

  const handleRotateItem = () => {
    if (selectedItemIdx === null) return;
    setPlacedItems(prev => prev.map((item, idx) => {
      if (idx !== selectedItemIdx) return item;
      const nextRotation = ((item.rotation + 90) % 360) as PlacedItem['rotation'];
      return { ...item, rotation: nextRotation };
    }));
  };

  const handleRemoveItem = () => {
    if (selectedItemIdx === null) return;
    setPlacedItems(prev => prev.filter((_, idx) => idx !== selectedItemIdx));
    setSelectedItemIdx(null);
  };

  const handleSaveMansion = async () => {
    if (!firestore || !activeCp?.id) return;
    setSavingMansion(true);
    try {
      const cpRef = doc(firestore, 'cpPairs', activeCp.id);
      await updateDocumentNonBlocking(cpRef, {
        mansionLayout: placedItems,
        updatedAt: serverTimestamp()
      });
      setIsEditMode(false);
      setSelectedItemIdx(null);
      toast({
        title: 'Mansion Saved! 🏡',
        description: 'Your couple sanctuary has been updated successfully.'
      });
    } catch (e) {
      console.error(e);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'Failed to save room layout. Please try again!'
      });
    } finally {
      setSavingMansion(false);
    }
  };

  if (!isMounted) return null;

  return (
    <AppLayout fullScreen>
      <div className={cn(
        "h-[100dvh] w-full flex flex-col relative overflow-hidden font-sans select-none transition-colors duration-700",
        activeMainTab === 'cp' ? "bg-pink-50" : "bg-blue-50"
      )}>

        {/* --- SINGLE 100DVH BACKGROUND IMAGE --- */}
        {backgroundImageUrl && (
          <img 
            src={backgroundImageUrl} 
            className="absolute inset-0 w-full h-full object-cover z-0" 
            alt="Background" 
          />
        )}

        {/* --- HEADER OVERLAY --- */}
        <header className="absolute top-0 w-full z-50 flex items-center justify-between px-6 pt-safe">
          <button onClick={() => router.back()} className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white mt-4">
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <div className="flex gap-8 mt-4">
            <button 
              onClick={() => setActiveMainTab('cp')}
              className={cn(
                "text-base font-black transition-all tracking-tight relative pb-1",
                activeMainTab === 'cp' ? "text-white" : "text-white/60"
              )}
            >
              CP
              {activeMainTab === 'cp' && (
                <motion.div layoutId="header-active-tab" className="absolute -bottom-1 left-0 right-0 h-1 bg-white rounded-full" />
              )}
            </button>
            <button 
              onClick={() => setActiveMainTab('friend')}
              className={cn(
                "text-base font-black transition-all tracking-tight relative pb-1",
                activeMainTab === 'friend' ? "text-white" : "text-white/60"
              )}
            >
              Friend
              {activeMainTab === 'friend' && (
                <motion.div layoutId="header-active-tab" className="absolute -bottom-1 left-0 right-0 h-1 bg-white rounded-full" />
              )}
            </button>
          </div>

          <div className="w-10 h-10 mt-4" />
        </header>

        {/* --- CONTENT OVERLAY ON TOP OF BACKGROUND --- */}
        <div className="relative z-10 flex flex-col h-full items-center justify-center">
          
          {/* MIDDLE AVATAR LINK LOBBY */}
          <div className="flex items-center justify-center px-6">
            <div className="flex items-center gap-12">
              
              <div className="flex flex-col items-center gap-1">
                <Avatar className="h-16 w-16 border-2 border-white/60 shadow-lg">
                  <AvatarImage src={userProfile?.avatarUrl || ''} className="object-cover" />
                  <AvatarFallback className="bg-pink-100 text-pink-500 font-bold">ME</AvatarFallback>
                </Avatar>
                <span className="text-[10px] font-black text-white drop-shadow-md uppercase tracking-widest bg-black/30 px-3 py-0.5 rounded-full">
                  {userProfile?.username?.split(' ')[0] || 'Me'}
                </span>
              </div>

              <div className="relative">
                 <Heart className={cn("h-10 w-10 animate-pulse drop-shadow-lg", activeCp ? "text-rose-400 fill-rose-400" : "text-white/70")} />
              </div>

              <div className="flex flex-col items-center gap-1">
                 {partnerProfile ? (
                    <>
                      <Avatar className="h-16 w-16 border-2 border-white/60 shadow-lg">
                        <AvatarImage src={partnerProfile.avatarUrl} className="object-cover" />
                        <AvatarFallback className="bg-pink-100 text-pink-500 font-bold">P</AvatarFallback>
                      </Avatar>
                      <span className="text-[10px] font-black text-white drop-shadow-md uppercase tracking-widest bg-black/30 px-3 py-0.5 rounded-full">
                        {partnerProfile?.username?.split(' ')[0] || 'Partner'}
                      </span>
                    </>
                 ) : (
                    <div className="flex flex-col items-center gap-1">
                      <button onClick={() => setShowSearch(true)} className="h-16 w-16 rounded-full border-2 border-dashed border-white/60 bg-white/10 backdrop-blur-sm flex items-center justify-center active:scale-95 transition-transform group shadow-lg">
                        <Plus className="h-7 w-7 text-white/80 group-hover:text-white" />
                      </button>
                      <span className="text-[10px] font-black text-white/70 drop-shadow-md uppercase tracking-widest">
                        Partner
                      </span>
                    </div>
                 )}
              </div>

            </div>
          </div>

          {/* MANSION EDITOR CONTROLS (Only visible in edit mode) */}
          {isEditMode && activeCp && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-8 left-4 right-4 z-50 bg-white/95 backdrop-blur-xl rounded-[2.5rem] border border-pink-100/50 shadow-2xl p-6"
            >
              <div className="flex flex-col gap-3">
                {/* --- THE ISOMETRIC 3D GRID CONTAINER --- */}
                <div className="relative w-full h-[180px] bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center select-none">
                  <div 
                    className="absolute w-[160px] h-[160px] transform transition-transform"
                    style={{
                      transform: 'rotateX(60deg) rotateZ(-45deg)',
                      transformStyle: 'preserve-3d'
                    }}
                  >
                    <div className="grid grid-cols-5 grid-rows-5 w-full h-full border border-white/10 bg-slate-900/40">
                      {Array.from({ length: 25 }).map((_, i) => (
                        <div key={i} className="border border-white/5 hover:bg-white/5 transition-colors" />
                      ))}
                    </div>

                    {placedItems.map((placed, idx) => {
                      const catalogItem = FURNITURE_CATALOG.find(item => item.id === placed.catalogId);
                      if (!catalogItem) return null;

                      const cellSize = 32;
                      const left = placed.x * cellSize;
                      const top = placed.y * cellSize;
                      const isSelected = selectedItemIdx === idx;

                      return (
                        <div
                          key={placed.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedItemIdx(idx);
                          }}
                          className={cn(
                            "absolute cursor-pointer transition-all duration-100",
                            isSelected ? "scale-105 filter brightness-125 z-50 border border-dashed border-cyan-400" : "hover:brightness-105 z-30"
                          )}
                          style={{
                            left,
                            top,
                            width: catalogItem.gridWidth * cellSize,
                            height: catalogItem.gridLength * cellSize,
                            transformStyle: 'preserve-3d',
                            transform: `translateZ(0px) rotate(${placed.rotation}deg)`,
                          }}
                        >
                          {catalogItem.renderSvg(isSelected ? '#22d3ee' : '#ec4899')}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* --- EDITOR CONTROLS --- */}
                <div className="bg-slate-50 border border-pink-100 rounded-2xl p-3 flex flex-col gap-2 shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Mansion Editor Console</span>
                    <button 
                      onClick={() => setIsCatalogOpen(true)}
                      className="px-3 py-1 bg-cyan-400 hover:bg-cyan-500 transition rounded-full font-black text-[9px] text-black"
                    >
                      + PLACE FURNITURE
                    </button>
                  </div>

                  {selectedItemIdx !== null ? (
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <div className="flex gap-2">
                        <button onClick={handleRotateItem} className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-700 shadow-sm active:scale-95 transition-transform">
                          <RotateCw className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={handleRemoveItem} className="p-2 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 text-red-500 shadow-sm active:scale-95 transition-transform">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 grid-rows-3 gap-0.5 w-20 h-20 bg-white/70 border rounded-2xl p-1 shadow-inner relative justify-items-center items-center shrink-0">
                        <button onClick={() => handleMoveItem('up')} className="p-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 col-start-2 row-start-1"><ChevronUp className="h-3.5 w-3.5" /></button>
                        <button onClick={() => handleMoveItem('left')} className="p-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 col-start-1 row-start-2"><ChevronLeftIcon className="h-3.5 w-3.5" /></button>
                        <button onClick={() => handleMoveItem('right')} className="p-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 col-start-3 row-start-2"><ChevronRight className="h-3.5 w-3.5" /></button>
                        <button onClick={() => handleMoveItem('down')} className="p-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 col-start-2 row-start-3"><ChevronDown className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 italic text-center py-4">Click any furniture item in the room to move, rotate, or remove it.</p>
                  )}

                  <div className="flex gap-2 mt-1">
                    <button 
                      onClick={handleSaveMansion}
                      disabled={savingMansion}
                      className="flex-1 px-4 py-1.5 bg-emerald-500 text-white font-bold text-[10px] rounded-full hover:bg-emerald-600 transition flex items-center justify-center gap-1 shadow-md"
                    >
                      <Save className="h-3 w-3" /> Save Mansion
                    </button>
                    <button 
                      onClick={() => { setIsEditMode(false); setSelectedItemIdx(null); }}
                      className="px-4 py-1.5 bg-slate-200 text-slate-700 font-bold text-[10px] rounded-full hover:bg-slate-300 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Design Room button (only visible when not in edit mode and CP exists) */}
          {!isEditMode && activeCp && (
            <button 
              onClick={() => setIsEditMode(true)}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-2 bg-pink-400 text-white font-bold text-sm rounded-full hover:bg-pink-500 transition flex items-center gap-2 shadow-lg"
            >
              <Wrench className="h-4 w-4" /> Design Room
            </button>
          )}
        </div>

        {/* --- Dialogs --- */}
        <UserSearchDialog isOpen={showSearch} onClose={() => setShowSearch(false)} onSelect={handleProposeTarget} />
        {selectedTarget && (
          <CPProposeDialog isOpen={showPropose} onClose={() => { setShowPropose(false); setSelectedTarget(null); }} targetUser={selectedTarget} />
        )}

        {/* --- FURNITURE CATALOG SHEET OVERLAY --- */}
        <AnimatePresence>
          {isCatalogOpen && (
            <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-end justify-center select-none" onClick={() => setIsCatalogOpen(false)}>
              <motion.div 
                initial={{ y: 300 }}
                animate={{ y: 0 }}
                exit={{ y: 300 }}
                className="w-full max-w-md bg-white rounded-t-[2.5rem] p-6 shadow-2xl border-t border-pink-100 flex flex-col gap-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b pb-3">
                  <span className="font-black text-xs text-slate-800 uppercase tracking-widest">Furniture Catalog (0 Cost)</span>
                  <button onClick={() => setIsCatalogOpen(false)} className="p-1 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3 overflow-y-auto max-h-[220px] py-1 content-start">
                  {FURNITURE_CATALOG.map((item) => {
                    const cpLevel = activeCp?.level || 1;
                    const isLocked = cpLevel < item.unlockLevel;

                    return (
                      <button
                        key={item.id}
                        onClick={() => handlePlaceItem(item.id)}
                        disabled={isLocked}
                        className={cn(
                          "flex flex-col items-center p-2 rounded-2xl border bg-slate-50 hover:bg-slate-100 transition relative overflow-hidden select-none",
                          isLocked ? "border-slate-100 opacity-50 cursor-not-allowed" : "border-pink-100 hover:border-pink-300"
                        )}
                      >
                        <div className="w-14 h-14 flex items-center justify-center mb-1">
                          {item.renderSvg()}
                        </div>
                        <span className="text-[10px] font-black text-slate-700 truncate w-full text-center">{item.name}</span>
                        <span className="text-[8px] font-bold text-slate-400 mt-0.5">
                          {item.price > 0 ? `${item.price} Coins` : 'FREE'}
                        </span>
                        
                        {isLocked && (
                          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex flex-col items-center justify-center gap-1">
                            <Lock className="h-4 w-4 text-pink-300" />
                            <span className="text-[8px] font-black text-pink-400 uppercase tracking-tighter">LVL {item.unlockLevel}</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </AppLayout>
  );
}
