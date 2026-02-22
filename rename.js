const fs = require('fs');
const path = require('path');

function replaceColorsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content
    .replace(/#d4af37/g, '#4285F4')
    .replace(/#D4AF37/g, '#4285F4')
    .replace(/#0a0a0b/gi, '#121212') // base bg
    .replace(/#0e0e10/gi, '#1e1e1e') // sidebar bg
    .replace(/#121214/gi, '#2d2d2d') // card bg
    .replace(/#18181b/gi, '#3c4043') // border dark
    .replace(/text-zinc-500/gi, 'text-gray-400')
    .replace(/text-zinc-600/gi, 'text-gray-500')
    .replace(/text-zinc-300/gi, 'text-gray-200')
    .replace(/border-zinc-/gi, 'border-gray-');
  
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Updated ' + filePath);
  }
}

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    if (['node_modules', '.git', 'dist'].includes(f)) continue;
    const fullPath = path.join(dir, f);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else {
      if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.html') || fullPath.endsWith('.json')) {
        replaceColorsInFile(fullPath);
      }
    }
  }
}

processDir('.');
