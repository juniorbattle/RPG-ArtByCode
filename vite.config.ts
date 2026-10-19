import { defineConfig } from 'vite';

export default defineConfig({
  // strictPort: another local project also uses 5173; fail instead of silently moving to the next port (operator decision T4, journal Passe O1)
  server: { port: 5173, strictPort: true, host: '127.0.0.1' },
  build: { target: 'es2022', chunkSizeWarningLimit: 1200 },
});
