import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      "/tile": {
        target: "http://127.0.0.1:8099/tile/",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tile/, ""),
      },
      "/geoserverApi": {
        target: "http://127.0.0.1:8099/geoserverApi/",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/geoserverApi/, ""),
      },
    },
  },
});
