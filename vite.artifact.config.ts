// Builds the demo as one self-contained HTML file (used for the hosted preview).
// React and Framer Motion load from a CDN; everything else is inlined.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  build: {
    outDir: 'dist-artifact',
    rollupOptions: {
      external: ['react', 'react-dom', 'react-dom/client', 'framer-motion'],
      output: {
        format: 'iife',
        globals: { react: 'React', 'react-dom': 'ReactDOM', 'react-dom/client': 'ReactDOM', 'framer-motion': 'Motion' },
      },
    },
  },
});
