import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  // GitHub Pages serves this project below /rubikslearn/; local development stays at /.
  base: process.env.NODE_ENV === 'production' ? '/rubikslearn/' : '/',
  plugins: [react()],
  server: { host: '0.0.0.0', port: 3000 },
  build: { chunkSizeWarningLimit: 850 },
});
