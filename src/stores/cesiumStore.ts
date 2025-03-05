import { defineStore } from "pinia";
import * as Cesium from "cesium";

export const useCesiumS = defineStore("cesiumS", {
  state: () => ({
    viewer: Cesium.Viewer,
  }),
  getters: {
    getCesiumS(): Cesium.Viewer {
      return this.viewer;
    },
  },
  actions: {
    setCesiumS(viewer: Cesium.Viewer) {
      this.viewer = viewer;
    },
  },
});
