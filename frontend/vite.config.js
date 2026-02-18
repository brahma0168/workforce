import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    allowedHosts: [
      '026fd74d-a296-452c-a108-55ad5c09b013.cluster-0.preview.emergentcf.cloud',
      '026fd74d-a296-452c-a108-55ad5c09b013.preview.emergentagent.com',
      '.preview.emergentagent.com',
      '.emergentcf.cloud',
      'localhost',
    ],
    hmr: {
      clientPort: 443,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
    },
  },
});
