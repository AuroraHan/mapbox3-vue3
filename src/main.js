import { createApp } from "vue";
import "./style.css";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import pinia from "/@/stores/index";
import { router } from "/@/router/index";
import App from "./App.vue";

createApp(App).use(pinia).use(ElementPlus).use(router).mount("#app");
