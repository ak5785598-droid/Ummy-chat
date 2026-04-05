import React from 'react';

// --- STYLES (Inline for easy copy-paste) ---
const styles = `
  @keyframes float-wings {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-8px) rotate(2deg); }
  }
  @keyframes glow-pulse {
    0%, 100% { filter: drop-shadow(0 0 15px rgba(255, 215, 0, 0.6)); }
    50% { filter: drop-shadow(0 0 25px rgba(0, 191, 255, 0.8)); }
  }
  .animate-wings { animation: float-wings 4s ease-in-out infinite; }
  .animate-frame-glow { animation: glow-pulse 3s infinite; }
`;

const EliteAvatarFrame = ({ src = "https://via.placeholder.com/150" }) => {
  return (
    <div className="relative flex items-center justify-center w-[300px] h-[300px] bg-[#050a18] rounded-xl overflow-hidden">
      <style>{styles}</style>

      {/* --- BACKGROUND AMBIENT GLOW --- */}
      <div className="absolute w-40 h-40 bg-blue-500/20 blur-[80px] rounded-full" />

      <div className="relative w-full h-full flex items-center justify-center animate-frame-glow">
        
        {/* --- SVG FRAME DESIGN (Matching Image 2) --- */}
        <svg viewBox="0 0 240 240" className="absolute w-full h-full pointer-events-none z-20">
          <defs>
            {/* Real Gold Texture Gradient */}
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#FFF8C4', stopOpacity: 1 }} />
              <stop offset="40%" style={{ stopColor: '#FFD700', stopOpacity: 1 }} />
              <stop offset="70%" style={{ stopColor: '#B8860B', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#8B6508', stopOpacity: 1 }} />
            </linearGradient>

            {/* Blue Crystal Gradient */}
            <radialGradient id="crystalGradient">
              <stop offset="0%" style={{ stopColor: '#00F0FF', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#0066FF', stopOpacity: 1 }} />
            </radialGradient>
          </defs>

          {/* Left Wing Group */}
          <g className="animate-wings" style={{ transformOrigin: 'center' }}>
            <path 
              d="M60,120 C20,100 10,60 50,40 C30,20 60,0 90,30 L80,50" 
              fill="url(#goldGradient)" 
              stroke="#FFF" strokeWidth="0.5"
            />
            <path 
              d="M55,130 C15,110 5,70 45,50" 
              fill="url(#crystalGradient)" 
              className="opacity-80"
            />
          </g>

          {/* Right Wing Group (Flipped) */}
          <g className="animate-wings" style={{ transformOrigin: 'center', transform: 'scaleX(-1)' }}>
            <path 
              d="M60,120 C20,100 10,60 50,40 C30,20 60,0 90,30 L80,50" 
              fill="url(#goldGradient)" 
              stroke="#FFF" strokeWidth="0.5"
            />
            <path 
              d="M55,130 C15,110 5,70 45,50" 
              fill="url(#crystalGradient)" 
              className="opacity-80"
            />
          </g>

          {/* Top Crown/Ornament */}
          <path 
            d="M100,45 L120,20 L140,45 L120,55 Z" 
            fill="url(#crystalGradient)" 
            stroke="url(#goldGradient)" 
            strokeWidth="2"
          />
          
          {/* Bottom Crystal Base */}
          <path 
            d="M100,195 L120,220 L140,195 L120,185 Z" 
            fill="url(#crystalGradient)" 
            stroke="url(#goldGradient)" 
            strokeWidth="2"
          />

          {/* Main Circular Golden Border */}
          <circle 
            cx="120" cy="120" r="78" 
            stroke="url(#goldGradient)" 
            strokeWidth="6" 
            fill="none" 
            strokeDasharray="10 5"
          />
        </svg>

        {/* --- ACTUAL AVATAR IMAGE --- */}
        <div className="relative z-10 w-36 h-36 rounded-full border-4 border-[#FFD700] overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
          <img 
            src={src} 
            alt="User Avatar" 
            className="w-full h-full object-cover"
          />
          {/* Inner Glossy Overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
        </div>

        {/* --- FLOATING PARTICLES --- */}
        <div className="absolute inset-0 z-30 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div 
              key={i}
              className="absolute w-1 h-1 bg-cyan-300 rounded-full animate-pulse"
              style={{
                top: `${20 + Math.random() * 60}%`,
                left: `${20 + Math.random() * 60}%`,
                animationDelay: `${i * 0.4}s`,
                boxShadow: '0 0 10px #00F0FF'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default EliteAvatarFrame;
