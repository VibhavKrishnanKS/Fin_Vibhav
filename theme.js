const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (f !== 'node_modules' && f !== '.git' && f !== '.github' && f !== 'dist') {
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    }
  });
}

walk('.', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.html')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content
      // Replace generic colors
      .replace(/#d4af37/gi, '#4285F4')
      .replace(/#0a0a0b/gi, '#121212') // base background
      .replace(/#0e0e10/gi, '#1e1e1e') // surface background
      .replace(/#121214/gi, '#2d2d2d') // lighter surface
      .replace(/#3f3f46/gi, '#9aa0a6')
      // Tailwind classes
      .replace(/bg-\[#d4af37\]/gi, 'bg-blue-600')
      .replace(/text-\[#d4af37\]/gi, 'text-blue-500')
      .replace(/border-\[#d4af37\]/gi, 'border-blue-500')
      .replace(/text-zinc-500/gi, 'text-gray-400')
      .replace(/text-zinc-300/gi, 'text-gray-200')
      .replace(/text-zinc-600/gi, 'text-gray-500')
      .replace(/zinc/gi, 'gray')
      .replace(/#e4e4e7/gi, '#f8f9fa') // Text color
      .replace(/#18181b/gi, '#3c4043') // Borders
      // Additional styling adjustments for professional look
      .replace(/shadow-xl/gi, 'shadow-2xl shadow-blue-500/10')
      .replace(/rounded-xl/gi, 'rounded-2xl')
      .replace(/border-white\/5/g, 'border-gray-800')
      .replace(/border-white\/10/g, 'border-gray-700')
      .replace(/bg-white\/\.?0?2/g, 'bg-gray-800/50')
      .replace(/bg-white\/5/g, 'bg-gray-800');

    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log('Updated', filePath);
    }
  }
});
