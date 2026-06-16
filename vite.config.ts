import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Клиент на :3000, backend (admin-app) на :3001.
// Проксируем /api на backend, чтобы избежать CORS в dev.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
