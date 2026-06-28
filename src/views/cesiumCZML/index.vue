<template>
  <!-- 工具集 -->
  <div id="cesiumContainer"></div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import * as Cesium from "cesium";
import { useCesium } from "@/hooks/useCesium";

let cesiumV: Cesium.Viewer;
const { getCesiumViewer } = useCesium({
  container: "cesiumContainer",
  timeline: false,
  animation: false,
  infoBox: false,
  addTerrain: false,
});

onMounted(() => {
  cesiumV = getCesiumViewer();
});
</script>

<style lang="scss" scoped>
#cesiumContainer {
  height: 100vh;
  width: 100%;
}
</style>
