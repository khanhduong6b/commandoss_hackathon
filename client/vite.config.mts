import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Allow external connections
    port: 5173,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'commandoss.duongfinance.com'
    ],
    proxy: {
      '/api': {
        target: 'https://commandoss-server.duongfinance.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, 'v1')
      }
    }
  }
});
