const fs = require('fs');

const clientPath = 'c:\\Users\\HP\\Downloads\\project\\src\\app\\rooms\\[slug]\\room-client.tsx';
let client = fs.readFileSync(clientPath, 'utf8');

const stateDefinition = 'const [showAnnouncements, setShowAnnouncements] = useState(true);';

if (!client.includes(stateDefinition)) {
    const anchor = 'const [activeSpeakers, setActiveSpeakers] = useState<Set<string>>(new Set());';
    const index = client.indexOf(anchor);
    if (index !== -1) {
        const afterAnchor = index + anchor.length;
        client = client.substring(0, afterAnchor) + '\n  const [showAnnouncements, setShowAnnouncements] = useState(true);' + client.substring(afterAnchor);
        fs.writeFileSync(clientPath, client);
        console.log('Successfully defined showAnnouncements state.');
    } else {
        console.log('Anchor not found!');
    }
} else {
    console.log('State definition already exists.');
}
