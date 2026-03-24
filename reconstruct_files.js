const fs = require('fs');

// --- Fix RoomPlayDialog.tsx ---
const playPath = 'c:\\Users\\HP\\Downloads\\project\\src\\components\\room-play-dialog.tsx';
let play = fs.readFileSync(playPath, 'utf8');

// 1. Fix the double/broken onClearChat in interface
play = play.replace(/interface RoomPlayDialogProps \{[\s\S]*?\}/, `interface RoomPlayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participants?: RoomParticipant[];
  roomId?: string;
  room?: any;
  isMutedLocal: boolean;
  setIsMutedLocal: (val: boolean) => void;
  onOpenGames: () => void;
  onPlayLocalMusic?: (file: File) => void;
  onClearChat?: () => void;
}`);

// 2. Fix the function signature
play = play.replace(/export function RoomPlayDialog\(\{[\s\S]*?\}\: RoomPlayDialogProps\)/, `export function RoomPlayDialog({ 
  open, 
  onOpenChange, 
  participants = [], 
  roomId, 
  room,
  isMutedLocal,
  setIsMutedLocal,
  onOpenGames,
  onPlayLocalMusic,
  onClearChat
}: RoomPlayDialogProps)`);

// 3. Fix handleClearChat
play = play.replace(/await batch\.commit\(\);\s*toast\(.*?\);\s*(if \(onClearChat\) onClearChat\(\);|`r`n\s*if \(onClearChat\) onClearChat\(\);)*/, `await batch.commit();
    toast({ title: 'Frequency Purified', description: 'Chat history cleared.' });
    if (onClearChat) onClearChat();`);

// 4. Fix handlePlayDeviceTrack
play = play.replace(/const handlePlayDeviceTrack = \(file\: File\) => \{[\s\S]*?\};/, `const handlePlayDeviceTrack = (file: File) => {
   setIsMusicEnabled(true);
   if (onPlayLocalMusic) {
    onPlayLocalMusic(file);
    toast({ title: 'Broadcasting Track', description: \`Syncing \${file.name} to room.\` });
   }
  };`);

fs.writeFileSync(playPath, play);

// --- Fix RoomClient.tsx ---
const clientPath = 'c:\\Users\\HP\\Downloads\\project\\src\\app\\rooms\\[slug]\\room-client.tsx';
let client = fs.readFileSync(clientPath, 'utf8');

// 1. Add state cleanly
if (!client.includes('showAnnouncements')) {
    client = client.replace(/const \[activeSpeakers, setActiveSpeakers\] = useState<Set<string>>\(new Set\(\)\);/, `const [activeSpeakers, setActiveSpeakers] = useState<Set<string>>(new Set());
  const [showAnnouncements, setShowAnnouncements] = useState(true);`);
}

// 2. Adjust background scaling
client = client.replace('className="object-cover opacity-60 animate-in fade-in duration-1000"', 'className="object-contain opacity-60 animate-in fade-in duration-1000"');

// 3. Ensure onClearChat is passed to RoomPlayDialog
if (!client.includes('onClearChat={() => setShowAnnouncements(false)}')) {
    client = client.replace('onPlayLocalMusic={handlePlayLocalMusic}', "onPlayLocalMusic={handlePlayLocalMusic}\n     onClearChat={() => setShowAnnouncements(false)}");
}

fs.writeFileSync(clientPath, client);

console.log('Reconstruction complete.');
