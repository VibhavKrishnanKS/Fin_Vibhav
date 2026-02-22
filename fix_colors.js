const fs = require('fs');
const path = require('path');

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    if (['node_modules', '.git', 'dist', 'package-lock.json'].includes(f)) continue;
    const fp = path.join(dir, f);
    if (fs.statSync(fp).isDirectory()) {
      walk(fp);
    } else if (fp.endsWith('.tsx') || fp.endsWith('.ts')) {
      let c = fs.readFileSync(fp, 'utf8');
      let n = c
        .replace(/#d4af37/gi, '#4285F4')
        .replace(/#0a0a0b/gi, '#121212')
        .replace(/#0e0e10/gi, '#1e1e1e')
        .replace(/text-\[#121212\]/gi, 'text-white')
        .replace(/bg-zinc-900/g, 'bg-[#2d2d2d]')
        .replace(/bg-zinc-950/g, 'bg-[#1e1e1e]')
        .replace(/bg-zinc-800/g, 'bg-[#3c4043]')
        .replace(/border-white\/5/g, 'border-gray-700')
        .replace(/border-white\/10/g, 'border-gray-600')
        .replace(/text-zinc-400/g, 'text-gray-400')
        .replace(/text-zinc-500/g, 'text-gray-400')
        .replace(/text-zinc-600/g, 'text-gray-500')
        .replace(/text-zinc-700/g, 'text-gray-600')
        .replace(/text-zinc-800/g, 'text-gray-700')
        .replace(/text-zinc-200/g, 'text-gray-200')
        .replace(/text-zinc-300/g, 'text-gray-300');
      if (c !== n) {
        fs.writeFileSync(fp, n, 'utf8');
        console.log('Fixed: ' + fp);
      }
    }
  }
}

walk('.');
console.log('DONE');
