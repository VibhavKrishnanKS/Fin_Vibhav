
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Use relative base path so the app works on GitHub Pages subfolders
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    // Ensure the build fails early if there are TS errors
    emptyOutDir: true,
  }
});
