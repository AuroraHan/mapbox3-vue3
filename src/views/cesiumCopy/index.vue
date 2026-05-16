<template>
  <div id="cesiumContainer">
    <div class="options">
      <button @click="addModel">添加模型</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import * as Cesium from "cesium";
import { useCesium } from "@/hooks/useCesium";
import { getCurrentPositionByMouseNew } from "@/utils/cesiumTools";

let cesiumV: Cesium.Viewer;
let handler: Cesium.ScreenSpaceEventHandler | null;
const { getCesiumViewer } = useCesium({
  container: "cesiumContainer",
  addTerrain: false,
  infoBox: false,
  shouldAnimate: true,
});

onMounted(() => {
  cesiumV = getCesiumViewer();
  handler = new Cesium.ScreenSpaceEventHandler(cesiumV.scene.canvas);

  mouseleftAndRight();
});

//鼠标左键和右键配合
const mouseleftAndRight = () => {
  handler?.setInputAction(
    (event: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      const currentPos = getCurrentPositionByMouseNew(cesiumV, event.position);
      console.log("当前坐标：", currentPos);

      // 右键点击事件,  移除左键事件
      handler?.setInputAction(() => {
        handler?.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
        handler?.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
      }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    },
    Cesium.ScreenSpaceEventType.LEFT_CLICK,
  );
};

//添加模型
const addModel = async () => {
  const modelEntity = cesiumV.entities.add({
    name: "Cesium Air",
    position: Cesium.Cartesian3.fromDegrees(120, 30, 0),
    model: {
      uri: "/models/Cesium_Air.glb",
      minimumPixelSize: 128,
      maximumScale: 20000,
    },
  });
};
</script>

<style lang="scss" scoped>
#cesiumContainer {
  height: 100vh;
  position: relative;
}

.options {
  position: absolute;
  left: 3%;
  top: 3%;
  width: 100px;
  height: 50px;
  z-index: 99;
}
</style>
