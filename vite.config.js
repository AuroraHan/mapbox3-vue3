import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/tile": {
        target: "http://192.168.0.113:8099/tile/",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tile/, ""),
      },
      "/geoserverApi": {
        target: "http://192.168.0.113:10002/",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/geoserverApi/, ""),
      },
    },
  },
});
