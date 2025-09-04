import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import cesium from "vite-plugin-cesium";
import path from "path";
import { resolve } from "path";

const pathResolve = (dir) => {
  return resolve(__dirname, ".", dir);
};

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    global: "globalThis",
  },
  plugins: [vue(), cesium()],
  resolve: {
    alias: {
      "/@": pathResolve("./src/"),
    },
  },
  server: {
    host: "0.0.0.0", // 服务器地址
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
      // "/dem": {
      //   target: "http://127.0.0.1:8099/dem",
      //   changeOrigin: true,
      //   rewrite: (path) => path.replace(/^\/dem/, ""),
      // },
      "/geoserverApi": {
        // target: "http://127.0.0.1:10002/",
        target: " http://127.0.0.1:8099/geoserverApi/",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/geoserverApi/, ""),
      },
    },
  },
});
