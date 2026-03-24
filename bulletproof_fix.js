const fs = require('fs');

const clientPath = 'c:\\Users\\HP\\Downloads\\project\\src\\app\\rooms\\[slug]\\room-client.tsx';
let client = fs.readFileSync(clientPath, 'utf8');

const anchor = 'const [now, setNow] = useState<number | null>(null);';
const index = client.indexOf(anchor);

if (index !== -1 && !client.includes('showAnnouncements')) {
    const afterAnchor = index + anchor.length;
    client = client.substring(0, afterAnchor) + '\n  const [showAnnouncements, setShowAnnouncements] = useState(true);' + client.substring(afterAnchor);
    fs.writeFileSync(clientPath, client);
    console.log('Successfully injected state.');
} else if (client.includes('showAnnouncements')) {
    console.log('State already exists.');
} else {
    console.log('Anchor not found!');
}
