import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // Only use your backend proxy - it will handle MET API calls
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
        configure: (proxy, options) => {
          proxy.on("error", (err, req, res) => {
            console.error("Backend proxy error:", err);
          });
        },
      },
    },
  },
});
