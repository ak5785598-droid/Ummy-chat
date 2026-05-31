import React, { useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export interface GiftBattleUser {
  uid: string;
  name: string;
  avatarUrl?: string | null;
}

interface GiftBattleCanvasProps {
  isActive: boolean;
  leftUser: GiftBattleUser | null;
  rightUser: GiftBattleUser | null;
  scoreLeft: number;
  scoreRight: number;
  winnerUid?: string | null;
  takeoverEffect?: 'gold' | 'neon' | 'cosmic' | null;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
  decay: number;
}

export const GiftBattleCanvas: React.FC<GiftBattleCanvasProps> = ({
  isActive,
  leftUser,
  rightUser,
  scoreLeft,
  scoreRight,
  winnerUid,
  takeoverEffect
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);
  const prevScoreLeft = useRef<number>(scoreLeft);
  const prevScoreRight = useRef<number>(scoreRight);

  // Helper to spawn dynamic particles at a specific position
  const spawnParticles = (x: number, y: number, color: string, count: number) => {
    const particles = particlesRef.current;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        alpha: 1,
        size: Math.random() * 3 + 2,
        decay: Math.random() * 0.02 + 0.015
      });
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI screens
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Main animation loop
    const render = () => {
      const w = canvas.getBoundingClientRect().width;
      const h = canvas.getBoundingClientRect().height;

      ctx.clearRect(0, 0, w, h);

      if (!isActive) return;

      const particles = particlesRef.current;

      // Draw Center Clash Zone
      const centerX = w / 2;
      const centerY = h / 2;

      // Calculate balance percentage
      const total = scoreLeft + scoreRight;
      const ratio = total > 0 ? scoreLeft / total : 0.5;

      // Dynamic clash center position based on score ratio
      const clashX = w * 0.2 + w * 0.6 * ratio;
      const clashY = centerY;

      // Draw energy orbs
      // Left Energy Orb (Red/Pink Glow)
      const gradLeft = ctx.createRadialGradient(clashX - 10, clashY, 5, clashX - 10, clashY, 40);
      gradLeft.addColorStop(0, 'rgba(239, 68, 68, 0.8)');
      gradLeft.addColorStop(0.5, 'rgba(239, 68, 68, 0.3)');
      gradLeft.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = gradLeft;
      ctx.beginPath();
      ctx.arc(clashX - 10, clashY, 40, 0, Math.PI * 2);
      ctx.fill();

      // Right Energy Orb (Cyan/Blue Glow)
      const gradRight = ctx.createRadialGradient(clashX + 10, clashY, 5, clashX + 10, clashY, 40);
      gradRight.addColorStop(0, 'rgba(6, 182, 212, 0.8)');
      gradRight.addColorStop(0.5, 'rgba(6, 182, 212, 0.3)');
      gradRight.addColorStop(1, 'rgba(6, 182, 212, 0)');
      ctx.fillStyle = gradRight;
      ctx.beginPath();
      ctx.arc(clashX + 10, clashY, 40, 0, Math.PI * 2);
      ctx.fill();

      // Draw active lightning bridge/clash spark
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(clashX - 8, clashY);
      
      // Draw wavy spark bridge
      let currentX = clashX - 8;
      const segments = 6;
      for (let i = 1; i <= segments; i++) {
        const nextX = clashX - 8 + (16 * i) / segments;
        const offsetY = (Math.random() - 0.5) * 15;
        ctx.lineTo(nextX, clashY + offsetY);
        currentX = nextX;
      }
      ctx.stroke();
      ctx.shadowBlur = 0; // reset shadow

      // Spawn continuous ambient clash sparks
      if (Math.random() < 0.4) {
        particles.push({
          x: clashX + (Math.random() - 0.5) * 20,
          y: clashY + (Math.random() - 0.5) * 20,
          vx: (Math.random() - 0.5) * 3,
          vy: (Math.random() - 0.5) * 3,
          color: Math.random() > 0.5 ? '#ef4444' : '#06b6d4',
          alpha: 1,
          size: Math.random() * 2 + 1,
          decay: 0.03
        });
      }

      // Render & Update Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.alpha <= 0 || p.x < 0 || p.x > w || p.y < 0 || p.y > h) {
          particles.splice(i, 1);
        }
      }
      ctx.globalAlpha = 1.0; // reset globalAlpha

      // Handle Takeover Effects
      if (takeoverEffect) {
        ctx.save();
        // Golden Rain Takeover
        if (takeoverEffect === 'gold') {
          // Spawn golden drops
          if (Math.random() < 0.15) {
            particles.push({
              x: Math.random() * w,
              y: 0,
              vx: (Math.random() - 0.5) * 1,
              vy: Math.random() * 4 + 3,
              color: '#D4AF37',
              alpha: 1,
              size: Math.random() * 2.5 + 1.5,
              decay: 0.008
            });
          }
          
          // Draw subtle golden border vignette
          const goldGrad = ctx.createLinearGradient(0, 0, 0, h);
          goldGrad.addColorStop(0, 'rgba(212, 175, 55, 0.08)');
          goldGrad.addColorStop(0.5, 'rgba(212, 175, 55, 0.02)');
          goldGrad.addColorStop(1, 'rgba(212, 175, 55, 0.08)');
          ctx.fillStyle = goldGrad;
          ctx.fillRect(0, 0, w, h);
        } 
        // Cosmic Purple Takeover
        else if (takeoverEffect === 'cosmic') {
          if (Math.random() < 0.15) {
            particles.push({
              x: Math.random() * w,
              y: h,
              vx: (Math.random() - 0.5) * 1,
              vy: -(Math.random() * 3 + 2),
              color: '#8b5cf6',
              alpha: 1,
              size: Math.random() * 2 + 1,
              decay: 0.01
            });
          }
          const cosmicGrad = ctx.createRadialGradient(w/2, h/2, 50, w/2, h/2, w);
          cosmicGrad.addColorStop(0, 'rgba(139, 92, 246, 0.04)');
          cosmicGrad.addColorStop(1, 'rgba(139, 92, 246, 0.01)');
          ctx.fillStyle = cosmicGrad;
          ctx.fillRect(0, 0, w, h);
        }
        ctx.restore();
      }

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, scoreLeft, scoreRight, takeoverEffect]);

  // Spawn impact sparks whenever scores change (simulating a gift impact)
  useEffect(() => {
    if (!isActive || !canvasRef.current) return;
    const w = canvasRef.current.getBoundingClientRect().width;
    const h = canvasRef.current.getBoundingClientRect().height;
    const total = scoreLeft + scoreRight;
    const ratio = total > 0 ? scoreLeft / total : 0.5;
    const clashX = w * 0.2 + w * 0.6 * ratio;
    const clashY = h / 2;

    if (scoreLeft > prevScoreLeft.current) {
      // Spawn Left (Red) particles
      spawnParticles(clashX, clashY, '#ef4444', 15);
      prevScoreLeft.current = scoreLeft;
    }
    if (scoreRight > prevScoreRight.current) {
      // Spawn Right (Cyan) particles
      spawnParticles(clashX, clashY, '#06b6d4', 15);
      prevScoreRight.current = scoreRight;
    }
  }, [scoreLeft, scoreRight, isActive]);

  if (!isActive) return null;

  return (
    <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-4 select-none">
      {/* Top Glass HUD showing scores & avatars */}
      <div className="w-full max-w-lg mx-auto bg-slate-950/75 border border-white/10 rounded-2xl p-3 shadow-2xl backdrop-blur-md flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          {/* Left Fighter */}
          <div className="flex items-center gap-2.5">
            <Avatar className="h-10 w-10 border border-red-500/50 shadow-lg shadow-red-500/10">
              <AvatarImage src={leftUser?.avatarUrl || ''} />
              <AvatarFallback className="bg-red-950 text-red-200 font-bold text-xs uppercase">
                {leftUser?.name?.substring(0, 2) || 'L'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-[11px] font-black text-red-400 max-w-[80px] truncate">{leftUser?.name || 'Left Host'}</span>
              <span className="text-sm font-black text-white">{scoreLeft}</span>
            </div>
          </div>

          {/* VS HUD */}
          <div className="flex flex-col items-center justify-center">
            <span className="text-xs font-black text-yellow-500 tracking-widest drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]">GIFT CLASH</span>
            <span className="text-[9px] font-bold text-white/40">TEAM BATTLE</span>
          </div>

          {/* Right Fighter */}
          <div className="flex items-center gap-2.5 flex-row-reverse text-right">
            <Avatar className="h-10 w-10 border border-cyan-500/50 shadow-lg shadow-cyan-500/10">
              <AvatarImage src={rightUser?.avatarUrl || ''} />
              <AvatarFallback className="bg-cyan-950 text-cyan-200 font-bold text-xs uppercase">
                {rightUser?.name?.substring(0, 2) || 'R'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-end">
              <span className="text-[11px] font-black text-cyan-400 max-w-[80px] truncate">{rightUser?.name || 'Right Host'}</span>
              <span className="text-sm font-black text-white">{scoreRight}</span>
            </div>
          </div>
        </div>

        {/* Dual Progress Bar */}
        <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden flex border border-white/5">
          <div 
            className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-300"
            style={{ width: `${(scoreLeft + scoreRight) > 0 ? (scoreLeft / (scoreLeft + scoreRight)) * 100 : 50}%` }}
          />
          <div 
            className="h-full bg-gradient-to-r from-cyan-400 to-cyan-600 transition-all duration-300 flex-1"
          />
        </div>
      </div>

      {/* Main Canvas Drawing Sparks */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full z-10 pointer-events-none"
      />

      {/* Dynamic Screen Takeover Announcement Banner */}
      {takeoverEffect && (
        <div className="w-full text-center mt-auto mb-20 animate-pulse z-30">
          <div className={cn(
            "inline-block px-6 py-2 rounded-full border shadow-2xl backdrop-blur-sm transform transition duration-500 scale-105",
            takeoverEffect === 'gold' 
              ? "bg-amber-500/25 border-amber-500 text-yellow-300 shadow-amber-500/20" 
              : "bg-purple-500/25 border-purple-500 text-purple-300 shadow-purple-500/20"
          )}>
            <span className="text-xs font-black uppercase tracking-[0.2em] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {takeoverEffect === 'gold' 
                ? `⚡ HOLOGRAPHIC TAKEOVER BY ${leftUser?.name || 'TEAM RED'}! 👑`
                : `✨ HOLOGRAPHIC TAKEOVER BY ${rightUser?.name || 'TEAM BLUE'}! 👑`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
