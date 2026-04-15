const fs = require('fs');
const path = 'c:\\Users\\HP\\Downloads\\project\\src\\app\\rooms\\[slug]\\room-client.tsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace('object-contain', 'object-cover');
fs.writeFileSync(path, content);
console.log('Reverted to object-cover');
