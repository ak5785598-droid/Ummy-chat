const fs = require('fs');

const playPath = 'c:\\Users\\HP\\Downloads\\project\\src\\components\\room-play-dialog.tsx';
let play = fs.readFileSync(playPath, 'utf8');

// Fix the corrupted RoomPlayDialog
play = play.replace(/onPlayLocalMusic\?: \(file: File\) => void;`r`n\s*onClearChat\?: \(\) => void;/g, "onPlayLocalMusic?: (file: File) => void;\n  onClearChat?: () => void;");
play = play.replace(/if \(onClearChat\) onClearChat\(\);`r`n\s*if \(onClearChat\) onClearChat\(\);/g, "if (onClearChat) onClearChat();");
// Just in case it's literal backticks
play = play.replace(/`r`n/g, "\n");
// Fix double if
play = play.replace(/if \(onClearChat\) onClearChat\(\);\s*if \(onClearChat\) onClearChat\(\);/g, "if (onClearChat) onClearChat();");

// Add prop if missing
if (!play.includes('onClearChat?: () => void;')) {
    play = play.replace('onPlayLocalMusic?: (file: File) => void;', 'onPlayLocalMusic?: (file: File) => void;\n  onClearChat?: () => void;');
}
if (!play.includes(', onClearChat')) {
    play = play.replace('onPlayLocalMusic', 'onPlayLocalMusic, onClearChat');
}

fs.writeFileSync(playPath, play);

const clientPath = 'c:\\Users\\HP\\Downloads\\project\\src\\app\\rooms\\[slug]\\room-client.tsx';
let client = fs.readFileSync(clientPath, 'utf8');

// Add state if missing
if (!client.includes('showAnnouncements')) {
    client = client.replace('const [activeSpeakers, setActiveSpeakers] = useState<Set<string>>(new Set());', 'const [activeSpeakers, setActiveSpeakers] = useState<Set<string>>(new Set());\n  const [showAnnouncements, setShowAnnouncements] = useState(true);');
}
// Wrap announcements if missing (it might be there already but broken)
if (!client.includes('{showAnnouncements &&')) {
     // This was already added in the first successful chunk
}
// Pass onClearChat if missing
if (!client.includes('onClearChat={() => setShowAnnouncements(false)}')) {
    client = client.replace('onPlayLocalMusic={handlePlayLocalMusic}', 'onPlayLocalMusic={handlePlayLocalMusic}\n     onClearChat={() => setShowAnnouncements(false)}');
}

// Adjust background scaling
client = client.replace('object-cover', 'object-contain');

fs.writeFileSync(clientPath, client);

console.log('Done!');
