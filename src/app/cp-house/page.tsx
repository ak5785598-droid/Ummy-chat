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

const FloatingHeart = ({ delay = 0, x = "50%", color = "text-white/40" }) => (
  <motion.div
    initial={{ y: 100, opacity: 0, scale: 0 }}
    animate={{ y: -500, opacity: [0, 1, 0], scale: [0.5, 1, 0.8] }}
    transition={{ duration: 6, repeat: Infinity, delay, ease: "linear" }}
    className="absolute z-0 pointer-events-none"
    style={{ left: x }}
  >
    <Heart className={cn("h-6 w-6 fill-current", color)} />
  </motion.div>
);

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
  const [showFullImage, setShowFullImage] = useState(false);

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

  // Determine which image URL to show full screen
  const fullScreenImageUrl = useMemo(() => {
    if (activeMainTab === 'cp') {
      if (config?.cpBgType === 'image' && config?.cpBgUrl) return getOptimizedMediaUrl(config.cpBgUrl);
      return null;
    } else {
      if (config?.friendBgType === 'image' && config?.friendBgUrl) return getOptimizedMediaUrl(config.friendBgUrl);
      return null;
    }
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

  // Toggle full screen image view
  const toggleFullImage = () => {
    if (fullScreenImageUrl) {
      setShowFullImage(!showFullImage);
    }
  };

  if (!isMounted) return null;

  // Background style for header area
  const headerBackgroundStyle = useMemo(() => {
    if (activeMainTab === 'cp' && config?.cpBgUrl) {
      return {
        backgroundImage: `url(${getOptimizedMediaUrl(config.cpBgUrl)})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }
    if (activeMainTab === 'friend' && config?.friendBgUrl) {
      return {
        backgroundImage: `url(${getOptimizedMediaUrl(config.friendBgUrl)})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }
    return {
      backgroundColor: activeMainTab === 'cp' ? cpHeaderTheme : (config?.friendHeaderTheme || '#60a5fa'),
    };
  }, [activeMainTab, config, cpHeaderTheme]);

  return (
    <AppLayout fullScreen>
      <div className={cn(
        "h-[100dvh] w-full flex flex-col relative overflow-hidden font-sans select-none transition-colors duration-700 bg-white",
        activeMainTab === 'cp' ? "bg-pink-50" : "bg-blue-50"
      )}>

        {/* --- FULL SCREEN IMAGE OVERLAY --- */}
        <AnimatePresence>
          {showFullImage && fullScreenImageUrl && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-black flex items-center justify-center"
              onClick={toggleFullImage}
            >
              <button 
                onClick={toggleFullImage}
                className="absolute top-6 right-6 z-10 p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition"
              >
                <X className="h-6 w-6" />
              </button>
              <img 
                src={fullScreenImageUrl} 
                alt="Full Screen Background" 
                className="w-full h-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- FULL SCREEN BACKGROUND --- */}
        <div 
          className="absolute inset-0 cursor-pointer"
          style={headerBackgroundStyle}
          onClick={toggleFullImage}
        />

        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 z-[1] pointer-events-none" />

        {/* --- TOP HEADER --- */}
        <header className="relative z-50 flex items-center justify-between px-4 pt-safe pb-2">
          {/* Back Button */}
          <button 
            onClick={() => router.back()} 
            className="p-2.5 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          {/* Tab Switcher - Text Only */}
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setActiveMainTab('cp')}
              className={cn(
                "text-base font-bold transition-all relative py-1",
                activeMainTab === 'cp' ? "text-white" : "text-white/50"
              )}
            >
              CP
              {activeMainTab === 'cp' && (
                <motion.div 
                  layoutId="activeTabIndicator" 
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-white rounded-full" 
                />
              )}
            </button>
            <button 
              onClick={() => setActiveMainTab('friend')}
              className={cn(
                "text-base font-bold transition-all relative py-1",
                activeMainTab === 'friend' ? "text-white" : "text-white/50"
              )}
            >
              Friends
              {activeMainTab === 'friend' && (
                <motion.div 
                  layoutId="activeTabIndicator" 
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-white rounded-full" 
                />
              )}
            </button>
          </div>

          {/* Help/Info Button */}
          <button className="p-2.5 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition">
            <HelpCircle className="h-5 w-5" />
          </button>
        </header>

        {/* --- MAIN CONTENT AREA --- */}
        <div className="relative z-10 flex-1 flex flex-col">
          
          {/* Center Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div 
              animate={{ y: [0, -8, 0] }} 
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              {activeMainTab === 'cp' ? (
                <Heart className="h-24 w-24 text-white fill-white drop-shadow-[0_0_30px_rgba(255,100,100,0.5)]" />
              ) : (
                <Handshake className="h-24 w-24 text-white drop-shadow-[0_0_30px_rgba(100,100,255,0.5)]" />
              )}
            </motion.div>
          </div>

          {/* Floating Hearts */}
          <FloatingHeart x="10%" delay={0} color="text-white/30" />
          <FloatingHeart x="90%" delay={2} color="text-white/30" />
          <FloatingHeart x="75%" delay={4} color="text-white/20" />

          {/* Full screen indicator */}
          {fullScreenImageUrl && (
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md rounded-full px-3 py-1 text-white text-[9px] font-bold">
              Tap anywhere to expand
            </div>
          )}

          {/* --- BOTTOM AVATAR SECTION --- */}
          <div className="absolute bottom-8 left-0 right-0 z-30 flex items-center justify-between px-8">
            
            {/* Left Avatar - Current User */}
            <div className="flex flex-col items-center gap-2">
              <button 
                className="relative group"
                onClick={() => {/* Optional: Edit profile */}}
              >
                <Avatar className="h-16 w-16 border-2 border-white shadow-lg">
                  <AvatarImage src={userProfile?.avatarUrl || ''} className="object-cover" />
                  <AvatarFallback className="bg-pink-200 text-pink-600 font-bold text-lg">
                    {(userProfile?.username?.[0] || 'M').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -top-1 -right-1 h-5 w-5 bg-green-400 rounded-full border-2 border-white" />
              </button>
              <span className="text-[10px] font-bold text-white uppercase tracking-widest drop-shadow-md">
                {userProfile?.username?.split(' ')[0] || 'You'}
              </span>
            </div>

            {/* Center Heart Indicator */}
            <motion.div 
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex flex-col items-center gap-1"
            >
              {activeCp ? (
                <Heart className="h-8 w-8 text-white fill-white drop-shadow-lg" />
              ) : (
                <div className="h-8 w-8 flex items-center justify-center">
                  <Plus className="h-5 w-5 text-white/60" />
                </div>
              )}
              <span className="text-[8px] font-bold text-white/70 uppercase tracking-widest">
                {activeCp ? 'Connected' : 'Search'}
              </span>
            </motion.div>

            {/* Right Avatar - Partner/Search */}
            <div className="flex flex-col items-center gap-2">
              {partnerProfile ? (
                <button 
                  className="relative group"
                  onClick={() => {/* Optional: View partner profile */}}
                >
                  <Avatar className="h-16 w-16 border-2 border-white shadow-lg">
                    <AvatarImage src={partnerProfile.avatarUrl} className="object-cover" />
                    <AvatarFallback className="bg-blue-200 text-blue-600 font-bold text-lg">
                      {(partnerProfile.username?.[0] || 'P').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -top-1 -right-1 h-5 w-5 bg-green-400 rounded-full border-2 border-white" />
                </button>
              ) : (
                <button 
                  onClick={() => setShowSearch(true)}
                  className="h-16 w-16 rounded-full border-2 border-dashed border-white/50 bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition group"
                >
                  <Plus className="h-6 w-6 text-white/70 group-hover:text-white group-hover:scale-110 transition-transform" />
                </button>
              )}
              <span className="text-[10px] font-bold text-white uppercase tracking-widest drop-shadow-md">
                {partnerProfile?.username?.split(' ')[0] || 'Partner'}
              </span>
            </div>
          </div>
        </div>

        {/* --- Dialogs --- */}
        <UserSearchDialog 
          isOpen={showSearch} 
          onClose={() => setShowSearch(false)} 
          onSelect={handleProposeTarget} 
        />
        {selectedTarget && (
          <CPProposeDialog 
            isOpen={showPropose} 
            onClose={() => { 
              setShowPropose(false); 
              setSelectedTarget(null); 
            }} 
            targetUser={selectedTarget} 
          />
        )}

        {/* --- FURNITURE CATALOG SHEET OVERLAY --- */}
        <AnimatePresence>
          {isCatalogOpen && (
            <div 
              className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-end justify-center select-none" 
              onClick={() => setIsCatalogOpen(false)}
            >
              <motion.div 
                initial={{ y: 300 }}
                animate={{ y: 0 }}
                exit={{ y: 300 }}
                className="w-full max-w-md bg-white rounded-t-[2.5rem] p-6 shadow-2xl border-t border-pink-100 flex flex-col gap-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b pb-3">
                  <span className="font-black text-xs text-slate-800 uppercase tracking-widest">Furniture Catalog</span>
                  <button 
                    onClick={() => setIsCatalogOpen(false)} 
                    className="p-1 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500"
                  >
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
                        <span className="text-[10px] font-black text-slate-700 truncate w-full text-center">
                          {item.name}
                        </span>
                        <span className="text-[8px] font-bold text-slate-400 mt-0.5">
                          {item.price > 0 ? `${item.price} Coins` : 'FREE'}
                        </span>
                        
                        {isLocked && (
                          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex flex-col items-center justify-center gap-1">
                            <Lock className="h-4 w-4 text-pink-300" />
                            <span className="text-[8px] font-black text-pink-400 uppercase tracking-tighter">
                              LVL {item.unlockLevel}
                            </span>
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
