import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import cesium from "vite-plugin-cesium";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), cesium()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    hmr: true,
    port: 4001,
    open: false,
    proxy: {
      "/tile": {
        target: "http://10.30.222.7:7788/tile",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tile/, ""),
      },
      // 地图文件代理
      "/dem": {
        target: "http://10.30.222.7:7788/dem",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/dem/, ""),
      },
      "/geoserverApi": {
        target: "http://127.0.0.1:10002/",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/geoserverApi/, ""),
      },
    },
  },
});
