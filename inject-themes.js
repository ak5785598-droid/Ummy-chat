const fs = require('fs');

const themesPath = 'c:\\Users\\HP\\Downloads\\project\\src\\lib\\themes.ts';
let themesCode = fs.readFileSync(themesPath, 'utf8');

const anchor = ` { 
  id: 'official_ummy', 
  name: 'Official Ummy', 
  url: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000', 
  isOfficial: true, 
  seatColor: 'rgba(255, 204, 0, 0.2)', 
  accentColor: '#FFCC00', 
  category: 'general' 
 },`;

const themesToAdd = `
 { 
  id: 'ummy_help_dark', 
  name: 'Ummy Help Center', 
  url: '/themes/help_center_dark.png',
  isOfficial: true,
  seatColor: 'rgba(59, 130, 246, 0.2)',
  accentColor: '#3b82f6',
  category: 'help'
 },
 { 
  id: 'ummy_help_light', 
  name: 'Ummy Support Light', 
  url: '/themes/help_center_light.png',
  isOfficial: true,
  seatColor: 'rgba(255, 255, 255, 0.2)',
  accentColor: '#f8fafc',
  category: 'help'
 },
 { 
  id: 'ummy_official_dark', 
  name: 'Ummy Official Dark', 
  url: '/themes/official_hub_dark.png', 
  isOfficial: true, 
  seatColor: 'rgba(251, 191, 36, 0.2)', 
  accentColor: '#fbbf24', 
  category: 'general' 
 },
 { 
  id: 'ummy_official_light', 
  name: 'Ummy Official Light', 
  url: '/themes/official_hub_light.png', 
  isOfficial: true, 
  seatColor: 'rgba(255, 255, 255, 0.2)', 
  accentColor: '#f8fafc', 
  category: 'general' 
 }`;

if(!themesCode.includes('ummy_help_dark')) {
  themesCode = themesCode.replace(anchor, anchor + themesToAdd);
  fs.writeFileSync(themesPath, themesCode);
}


const roomClientPath = 'c:\\Users\\HP\\Downloads\\project\\src\\app\\rooms\\[slug]\\room-client.tsx';
let roomClientCode = fs.readFileSync(roomClientPath, 'utf8');

const bgAnchor = `    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90 z-10" />
   </div>`;

const watermarkOverlay = `    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90 z-10" />
    
    {(room.roomThemeId === 'ummy_help_dark' || room.roomThemeId === 'ummy_help_light') && (
     <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none opacity-30 mix-blend-overlay pb-32">
       <div className="bg-white/5 backdrop-blur-[2px] p-8 rounded-[3rem] border border-white/10 flex flex-col items-center shadow-2xl">
         <UmmyLogoIcon className="h-32 w-32 mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] opacity-90" />
         <h1 className="text-3xl font-black text-white tracking-widest uppercase drop-shadow-md">Ummy Help</h1>
       </div>
     </div>
    )}

    {(room.roomThemeId === 'ummy_official_dark' || room.roomThemeId === 'ummy_official_light') && (
     <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none opacity-30 mix-blend-overlay pb-32">
       <div className="bg-white/5 backdrop-blur-[2px] p-8 rounded-[3rem] border border-white/10 flex flex-col items-center shadow-2xl">
         <UmmyLogoIcon className="h-32 w-32 mb-4 drop-shadow-[0_0_15px_rgba(255,204,0,0.8)] opacity-90" />
         <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-400 tracking-widest uppercase drop-shadow-md">Ummy Official</h1>
       </div>
     </div>
    )}
   </div>`;

if(!roomClientCode.includes('ummy_help_dark')) {
  roomClientCode = roomClientCode.replace(bgAnchor, watermarkOverlay);
  fs.writeFileSync(roomClientPath, roomClientCode);
}

console.log("Injected");
