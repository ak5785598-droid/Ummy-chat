const fs = require('fs');

const clientPath = 'c:\\Users\\HP\\Downloads\\project\\src\\app\\rooms\\[slug]\\room-client.tsx';
let client = fs.readFileSync(clientPath, 'utf8');

// Use a more flexible regex for state addition
const stateRegex = /const \[activeSpeakers, setActiveSpeakers\] = useState<Set<string>>\(new Set\(\)\);/;
if (!client.includes('showAnnouncements')) {
    client = client.replace(stateRegex, 'const [activeSpeakers, setActiveSpeakers] = useState<Set<string>>(new Set());\n  const [showAnnouncements, setShowAnnouncements] = useState(true);');
}

// Ensure background scaling
client = client.replace(/className="object-cover opacity-60 animate-in fade-in duration-1000"/g, 'className="object-contain opacity-60 animate-in fade-in duration-1000"');

// Ensure callback is passed
if (!client.includes('onClearChat={() => setShowAnnouncements(false)}')) {
    client = client.replace('onPlayLocalMusic={handlePlayLocalMusic}', "onPlayLocalMusic={handlePlayLocalMusic}\n     onClearChat={() => setShowAnnouncements(false)}");
}

fs.writeFileSync(clientPath, client);
console.log('Client fixed.');
