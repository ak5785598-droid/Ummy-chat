'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Trophy, Gift, Heart, Sparkles as SparklesIcon, Star, Music } from 'lucide-react';

interface GiftAnimationOverlayProps {
 giftId: string | null;
 onComplete: () => void;
 senderName?: string | null;
}

/**
 * High-Fidelity Universal Gift Animation Engine.
 */
export function GiftAnimationOverlay({ giftId, onComplete, senderName }: GiftAnimationOverlayProps) {
 const [isVisible, setIsVisible] = useState(false);
 const [triggerKey, setTriggerKey] = useState(0);

 useEffect(() => {
  if (giftId && typeof giftId === 'string') {
   setIsVisible(true);
   setTriggerKey(prev => prev + 1);
   
   let duration = 3000;
   const highTier = ['galaxy', 'rolex', 'color-carnival', 'lucky-jackpot', 'dragon', 'celebration', 'propose-ring', 'jet', 'supernova', 'cake'];
   if (highTier.includes(giftId)) duration = 5000;

   const timer = setTimeout(() => {
    setIsVisible(false);
    onComplete();
   }, duration);
   return () => clearTimeout(timer);
  }
 }, [giftId, onComplete]);

 if (!giftId || !isVisible || typeof giftId !== 'string') return null;

 const getEmoji = () => {
  if (giftId === 'lucky-clover') return '🍀';
  if (giftId === 'lucky-crown') return '👑';
  if (giftId === 'lucky-maple') return '🍁';
  if (giftId === 'lucky-star') return '⭐';
  
  switch (giftId) {
   case 'rose': return '🌹';
   case 'heart': return '💖';
   case 'ring': return '💍';
   case 'car': return '🏎️';
   case 'jet': return '🛩️';
   case 'dragon': return '🐉';
   case 'rocket': return '🚀';
   case 'castle': return '🏰';
   case 'galaxy': return '🌌';
   case 'supernova': return '💥';
   case 'rolex': return '⌚';
   case 'celebration': return '🥳';
   case 'color-carnival': return '🌈';
   case 'cake': return '🎂';
   default: return '🎁';
  }
 };

 const isHighTier = ['dragon', 'supernova', 'rolex', 'celebration', 'lucky-jackpot', 'jet', 'galaxy', 'color-carnival', 'cake'].includes(giftId);

 return (
  <div key={triggerKey} className="fixed inset-0 z-[300] pointer-events-none flex items-center justify-center overflow-hidden">
   
   {isHighTier && (
    <div className="absolute inset-0 animate-screen-flash bg-white pointer-events-none z-[301]" />
   )}

   {giftId === 'lucky-jackpot' && (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md animate-in zoom-in duration-700 z-[305]">
      <div className="relative mb-8">
       <div className="absolute inset-0 bg-yellow-400 blur-3xl opacity-40 animate-pulse" />
       <div className="bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-700 border-[6px] border-white p-8 rounded-full shadow-[0_0_50px_rgba(251,191,36,0.8)] animate-shimmer-gold relative z-10">
         <Trophy className="h-24 w-32 text-white drop-shadow-2xl" />
       </div>
      </div>
      <h2 className="text-7xl font-bold text-white uppercase tracking-tight drop-shadow-2xl animate-bounce text-center">JACKPOT SYNC</h2>
    </div>
   )}

   {giftId === 'propose-ring' && <ProposeRingAnimation />}
   
   {giftId === 'cake' && <CakeAnimation senderName={senderName} />}

   {(giftId.startsWith('lucky-') || (isHighTier && giftId !== 'propose-ring' && giftId !== 'cake')) && (
    <div className="absolute inset-0 z-[302] flex items-center justify-center">
      {Array.from({ length: 30 }).map((_, i) => (
       <div 
        key={i} 
        className={cn(
         "absolute opacity-0",
         giftId === 'lucky-clover' ? "animate-lucky-float-green" : 
         giftId === 'lucky-crown' ? "animate-lucky-float-gold" :
         giftId === 'color-carnival' ? "animate-lucky-float-rainbow" :
         "animate-lucky-float-gold"
        )}
        style={{ 
         left: `${Math.random() * 100}%`, 
         top: `${Math.random() * 100}%`,
         animationDelay: `${Math.random() * 2}s`,
         animationDuration: `${3 + Math.random() * 2}s`,
         fontSize: `${20 + Math.random() * 40}px`,
         filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.5))'
        }}
       >
        {getEmoji()}
       </div>
      ))}
    </div>
   )}

   {giftId !== 'propose-ring' && giftId !== 'cake' && (
    <div className={cn(
     "filter drop-shadow-[0_0_50px_rgba(255,255,255,0.8)] transition-all",
     isHighTier ? "text-[12rem] animate-lucky-center-pop" : "text-9xl animate-standard-gift-pop"
    )}>
     {getEmoji()}
    </div>
   )}

   <style jsx>{`
    @keyframes screen-flash { 0% { opacity: 0; } 10% { opacity: 0.8; } 100% { opacity: 0; } }
    .animate-screen-flash { animation: screen-flash 0.5s ease-out forwards; }
    
    @keyframes standard-gift-pop {
     0% { transform: scale(0) rotate(-20deg); opacity: 0; }
     20% { transform: scale(1.4) rotate(10deg); opacity: 1; }
     80% { transform: scale(1.2) rotate(0deg); opacity: 1; }
     100% { transform: scale(2) translateY(-100px); opacity: 0; }
    }
    .animate-standard-gift-pop { animation: standard-gift-pop 3s ease-in-out forwards; }

    @keyframes lucky-center-pop {
     0% { transform: scale(0) rotate(-45deg); opacity: 0; }
     30% { transform: scale(1.5) rotate(10deg); opacity: 1; }
     70% { transform: scale(1.2) rotate(-5deg); opacity: 1; }
     100% { transform: scale(3); opacity: 0; }
    }
    .animate-lucky-center-pop { animation: lucky-center-pop 5s forwards; }

    @keyframes lucky-float-rainbow {
     0% { transform: translate(0, 100vh) rotate(0); opacity: 0; }
     20% { opacity: 1; }
     100% { transform: translate(100px, -100vh) rotate(720deg); filter: hue-rotate(360deg); opacity: 0; }
    }
    .animate-lucky-float-rainbow { animation: lucky-float-rainbow 4s linear infinite; }

    @keyframes lucky-float-gold { 0% { transform: scale(0) rotate(0); opacity: 0; } 50% { opacity: 1; transform: scale(1.2); } 100% { transform: scale(2) rotate(360deg); opacity: 0; } }
    .animate-lucky-float-gold { animation: lucky-float-gold 3s ease-out infinite; }

    @keyframes lucky-float-green { 0% { transform: translateY(100vh) rotate(0); opacity: 0; } 20% { opacity: 1; } 100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; } }
    .animate-lucky-float-green { animation: lucky-float-green 4s linear infinite; }
   `}</style>
  </div>
 );
}

const CakeAnimation = ({ senderName }: { senderName?: string | null }) => (
 <div className="relative flex flex-col items-center justify-center animate-cake-pop-in duration-1000">
  {/* Floating Elements Engine */}
  <div className="absolute inset-0 pointer-events-none overflow-visible">
    {[...Array(12)].map((_, i) => (
     <div key={i} className="absolute animate-cake-particle" style={{
      left: '50%', top: '50%',
      animationDelay: `${i * 0.2}s`,
      transform: `rotate(${i * 30}deg)`
     }}>
      <div className="text-2xl opacity-0 animate-cake-fade-out" style={{ animationDelay: `${i * 0.2}s` }}>
        {i % 3 === 0 ? '✨' : i % 3 === 1 ? '⭐' : '🎵'}
      </div>
     </div>
    ))}
    {[...Array(6)].map((_, i) => (
     <div key={`orbit-${i}`} className="absolute animate-cake-orbit" style={{
      left: '50%', top: '50%',
      animationDelay: `${i * 0.5}s`,
      width: `${150 + i * 20}px`,
      height: `${150 + i * 20}px`,
      marginLeft: `-${(150 + i * 20)/2}px`,
      marginTop: `-${(150 + i * 20)/2}px`,
     }}>
      <div className="text-xl">
        {i % 2 === 0 ? '❤️' : '⭐'}
      </div>
     </div>
    ))}
  </div>

  {/* Sender Identity Label */}
  <div className="absolute -top-24 z-50 bg-black/40 backdrop-blur-md px-6 py-2 rounded-full border-2 border-white/20 shadow-2xl animate-in slide-in-from-top-4 duration-1000">
    <p className="text-sm font-bold uppercase text-pink-400 drop-shadow-md">
     {senderName || 'Tribe Member'} sent a Cake
    </p>
  </div>

  {/* The Glowing Three-Layer Cake SVG */}
  <div className="relative z-10 filter drop-shadow-[0_0_40px_rgba(255,105,180,0.6)] animate-cake-float">
    <svg width="240" height="240" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
     <defs>
       <linearGradient id="cakePink" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFB6C1" />
        <stop offset="100%" stopColor="#FF69B4" />
       </linearGradient>
       <filter id="cakeGlow">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
       </filter>
     </defs>

     {/* Bottom Layer */}
     <path d="M40 140 Q40 135 45 135 L155 135 Q160 135 160 140 L160 175 Q160 185 155 185 L45 185 Q40 185 40 175 Z" fill="url(#cakePink)" stroke="#880e4f" strokeWidth="1" />
     <path d="M40 140 Q50 155 65 140 Q80 125 95 140 Q110 155 125 140 Q140 125 150 140 Q160 155 160 140" stroke="white" strokeWidth="6" strokeLinecap="round" opacity="0.9" />

     {/* Middle Layer with Candies */}
     <path d="M55 90 Q55 85 60 85 L140 85 Q145 85 145 90 L145 135 L55 135 Z" fill="url(#cakePink)" stroke="#880e4f" strokeWidth="1" />
     <circle cx="70" cy="110" r="4" fill="#FF6B6B" className="animate-pulse" />
     <circle cx="100" cy="100" r="4" fill="#4ECDC4" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
     <circle cx="130" cy="115" r="4" fill="#FFE66D" className="animate-pulse" style={{ animationDelay: '1s' }} />
     
     {/* Top Layer */}
     <path d="M70 50 Q70 45 75 45 L125 45 Q130 45 130 50 L130 85 L70 85 Z" fill="url(#cakePink)" stroke="#880e4f" strokeWidth="1" />
     <path d="M70 50 Q80 60 90 50 Q100 40 110 50 Q120 60 130 50" stroke="white" strokeWidth="4" strokeLinecap="round" opacity="0.9" />

     {/* Cake Topper */}
     <g transform="translate(100, 30)">
       <path d="M0 -15 L4 -5 L14 -5 L6 2 L10 12 L0 6 L-10 12 L-6 2 L-14 -5 L-4 -5 Z" fill="#FFD700" stroke="#b45309" strokeWidth="1" className="animate-shimmer-gold" />
       <circle cx="-15" cy="10" r="5" fill="#f472b6" />
       <circle cx="15" cy="10" r="5" fill="#f472b6" />
     </g>

     {/* Candy Shine Sweep */}
     <rect x="0" y="0" width="10" height="200" fill="white" opacity="0.3" transform="rotate(45) translate(0, -100)">
       <animateTransform attributeName="transform" type="translate" from="-100, -100" to="200, 100" dur="2s" repeatCount="indefinite" />
     </rect>
    </svg>
  </div>

  <style jsx>{`
   @keyframes cake-pop-in {
    0% { transform: scale(0); opacity: 0; }
    60% { transform: scale(1.2); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
   }
   .animate-cake-pop-in { animation: cake-pop-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }

   @keyframes cake-float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-15px); }
   }
   .animate-cake-float { animation: cake-float 3s ease-in-out infinite; }

   @keyframes cake-particle {
    0% { transform: rotate(var(--rot)) translateY(0); opacity: 0; }
    20% { opacity: 1; }
    100% { transform: rotate(var(--rot)) translateY(-150px); opacity: 0; }
   }
   .animate-cake-particle { 
    animation: cake-particle 1.5s ease-out forwards; 
    --rot: inherit;
   }

   @keyframes cake-fade-out {
    0% { opacity: 0; transform: scale(0.5); }
    50% { opacity: 1; transform: scale(1); }
    100% { opacity: 0; transform: scale(1.5); }
   }
   .animate-cake-fade-out { animation: cake-fade-out 1.5s ease-out forwards; }

   @keyframes cake-orbit {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
   }
   .animate-cake-orbit { animation: cake-orbit 8s linear infinite; }
  `}</style>
 </div>
);

const ProposeRingAnimation = () => (
 <div className="relative w-full h-full flex items-center justify-center bg-black/60 backdrop-blur-[8px] animate-in fade-in duration-700 z-[310]">
  <div className="relative z-10 w-[400px] h-[400px] flex items-center justify-center perspective-1000">
   
   {/* Background Radiance */}
   <div className="absolute inset-0 bg-pink-500/20 blur-[100px] animate-pulse rounded-full" />
   
   <div className="relative transform-gpu animate-box-entrance">
     {/* Shadow Sync */}
     <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-48 h-10 bg-black/40 blur-xl rounded-full scale-x-150" />
     
     <div className="relative w-80 h-80">
      {/* Box Body (High-Fidelity Red Gradient) */}
      <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full drop-shadow-2xl">
        <defs>
         <linearGradient id="boxRedGiftLarge" x1="0%" y1="0%" x2="0%" y2="100%">
           <stop offset="0%" stopColor="#ff1a1a" />
           <stop offset="100%" stopColor="#990000" />
         </linearGradient>
         <filter id="boxGlow">
           <feGaussianBlur stdDeviation="3" result="blur" />
           <feComposite in="SourceGraphic" in2="blur" operator="over" />
         </filter>
        </defs>
        <path d="M100 180 C40 160 10 110 10 80 C10 50 40 35 100 70 C160 35 190 50 190 80 C190 110 160 160 100 180" fill="url(#boxRedGiftLarge)" stroke="#4d0000" strokeWidth="1" filter="url(#boxGlow)" />
        
        {/* Ornate Gold Trim */}
        <path d="M100 180 C45 165 15 115 15 80" fill="none" stroke="#fbbf24" strokeWidth="0.5" opacity="0.4" />
        <path d="M100 180 C155 165 185 115 185 80" fill="none" stroke="#fbbf24" strokeWidth="0.5" opacity="0.4" />
      </svg>

      {/* Cinematic Ring Rise */}
      <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 opacity-0 animate-ring-rise text-9xl drop-shadow-[0_0_30px_rgba(255,255,255,0.8)]">
        💍
      </div>

      {/* Floating Hearts from Box */}
      <div className="absolute inset-0 z-25 pointer-events-none">
        {[1,2,3,4,5].map(i => (
         <div key={i} className="absolute left-1/2 top-1/2 text-4xl animate-box-heart-pop" style={{ animationDelay: `${0.5 + i * 0.2}s` }}>❤️</div>
        ))}
      </div>

      {/* High-Fidelity Lid Sync */}
      <div className="absolute inset-0 z-30 origin-[50%_40%] animate-lid-open">
        <svg viewBox="0 0 200 200" className="w-full h-full">
         <path d="M100 180 C40 160 10 110 10 80 C10 50 40 35 100 70 C160 35 190 50 190 80 C190 110 160 160 100 180" fill="#800000" stroke="#4d0000" strokeWidth="1" />
         {/* Lid Ribbon */}
         <path d="M100 70 L100 180" stroke="#fbbf24" strokeWidth="4" opacity="0.8" />
         <circle cx="100" cy="70" r="10" fill="#fbbf24" />
        </svg>
      </div>
     </div>
   </div>
  </div>
  
  <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-center animate-in slide-in-from-bottom-10 duration-1000 delay-500">
    <h2 className="text-4xl font-bold text-pink-400 uppercase tracking-tight drop-shadow-lg">PROPOSE SYNC</h2>
    <p className="text-white/60 font-bold uppercase tracking-[0.3em] text-[10px] mt-2">Established High-Fidelity Frequency</p>
  </div>

  <style jsx>{`
   @keyframes box-entrance { 0% { transform: scale(0) rotate(-10deg); opacity: 0; } 60% { transform: scale(1.1) rotate(5deg); opacity: 1; } 100% { transform: scale(1) rotate(0deg); opacity: 1; } }
   @keyframes lid-open { 0%, 20% { transform: rotateX(0); opacity: 1; } 60%, 100% { transform: rotateX(-120deg) translateY(-150px) translateZ(50px); opacity: 0; } }
   @keyframes ring-rise { 0%, 40% { opacity: 0; transform: translate(-50%, 40px) scale(0.5); } 75% { opacity: 1; transform: translate(-50%, -60px) scale(1.8); } 100% { opacity: 0; transform: translate(-50%, -120px) scale(2.5); } }
   @keyframes box-heart-pop { 0%, 45% { opacity: 0; transform: translate(-50%, -50%) scale(0); } 70% { opacity: 1; transform: translate(-50%, -150%) scale(1.2); } 100% { opacity: 0; transform: translate(-50%, -250%) scale(1.5); } }
   
   .animate-box-entrance { animation: box-entrance 1.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
   .animate-lid-open { animation: lid-open 5s cubic-bezier(0.45, 0, 0.55, 1) forwards; }
   .animate-ring-rise { animation: ring-rise 5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
   .animate-box-heart-pop { animation: box-heart-pop 4s ease-out forwards; }
  `}</style>
 </div>
);
