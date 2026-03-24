const fs = require('fs');

const filesToClean = [
  'c:\\Users\\HP\\Downloads\\project\\src\\app\\profile\\[id]\\page.tsx',
  'c:\\Users\\HP\\Downloads\\project\\src\\app\\settings\\page.tsx',
  'c:\\Users\\HP\\Downloads\\project\\src\\app\\wallet\\page.tsx',
  'c:\\Users\\HP\\Downloads\\project\\src\\app\\wallet\\exchange\\page.tsx',
  'c:\\Users\\HP\\Downloads\\project\\src\\app\\leaderboard\\page.tsx',
  'c:\\Users\\HP\\Downloads\\project\\src\\app\\level\\page.tsx',
  'c:\\Users\\HP\\Downloads\\project\\src\\app\\about\\page.tsx',
  'c:\\Users\\HP\\Downloads\\project\\src\\app\\svip\\page.tsx',
  'c:\\Users\\HP\\Downloads\\project\\src\\app\\tasks\\page.tsx',
  'c:\\Users\\HP\\Downloads\\project\\src\\app\\store\\page.tsx',
  'c:\\Users\\HP\\Downloads\\project\\src\\app\\cp-house\\page.tsx',
  'c:\\Users\\HP\\Downloads\\project\\src\\app\\help-center\\page.tsx'
];

filesToClean.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/<AppLayout[^>]*>/g, match => {
      let newMatch = '<AppLayout';
      if (match.includes('fullScreen')) newMatch += ' fullScreen';
      newMatch += '>';
      return newMatch;
    });
    fs.writeFileSync(file, content);
  }
});

const layoutPath = 'c:\\Users\\HP\\Downloads\\project\\src\\components\\layout\\app-layout.tsx';
let layout = fs.readFileSync(layoutPath, 'utf8');
layout = layout.replace("pathname?.startsWith('/about');", `pathname?.startsWith('/about') ||\n          pathname?.startsWith('/leaderboard') ||\n          pathname?.startsWith('/games') ||\n          pathname?.startsWith('/svip');`);
layout = layout.replace('const shouldShowBottomNav = !hideBottomNav && isMainNav && !hideSidebarOnMobile;', 'const shouldShowBottomNav = !hideBottomNav && isMainNav && !fullScreen;');
fs.writeFileSync(layoutPath, layout);

console.log("Navigation attributes successfully synchronized.");
