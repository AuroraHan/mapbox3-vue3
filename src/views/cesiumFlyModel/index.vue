<template>
  <div id="cesiumContainer"></div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, h, render, ref, watchEffect } from "vue";
import * as Cesium from "cesium";
import { useCesium } from "@/hooks/useCesium";
import InfoBox from "./components/InfoBox.vue";

let cesiumV: Cesium.Viewer;
const { getCesiumViewer } = useCesium({
  container: "cesiumContainer",
  timeline: true,
  animation: true,
  shouldAnimate: true,
});

// 飞行路径关键点 [经度, 纬度, 高度(米)]
const flightPath = [
  [116.39, 39.9, 5000],
  [116.5, 39.95, 6000],
  [116.6, 40.0, 7000],
  [116.7, 40.1, 8000],
  [116.8, 40.05, 7500],
  [116.9, 39.98, 6500],
  [117.0, 39.92, 5500],
];

let planeEntity: Cesium.Entity | null = null;
let infoBoxContainer: HTMLDivElement | null = null;
let removePreRenderListener: (() => void) | null = null;

// 飞机经纬度信息
const planePosition = ref({
  longitude: 0,
  latitude: 0,
  altitude: 0,
});

// 创建飞机飞行路线
function createFlightPath() {
  const position = new Cesium.SampledPositionProperty();

  const startTime = cesiumV.clock.currentTime;
  const duration = (flightPath.length - 1) * 5;
  const stopTime = Cesium.JulianDate.addSeconds(
    startTime,
    duration,
    new Cesium.JulianDate(),
  );

  flightPath.forEach((point, index) => {
    const time = Cesium.JulianDate.addSeconds(
      startTime,
      index * 5,
      new Cesium.JulianDate(),
    );
    const positionValue = Cesium.Cartesian3.fromDegrees(
      point[0],
      point[1],
      point[2],
    );
    position.addSample(time, positionValue);
  });

  // 设置时钟循环播放
  cesiumV.clock.startTime = startTime.clone();
  cesiumV.clock.stopTime = stopTime.clone();
  cesiumV.clock.currentTime = startTime.clone();
  cesiumV.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
  cesiumV.clock.multiplier = 1;

  planeEntity = cesiumV.entities.add({
    name: "飞行飞机",
    availability: new Cesium.TimeIntervalCollection([
      new Cesium.TimeInterval({
        start: startTime,
        stop: Cesium.JulianDate.addSeconds(
          startTime,
          (flightPath.length - 1) * 5,
          new Cesium.JulianDate(),
        ),
      }),
    ]),
    position: position,
    orientation: new Cesium.VelocityOrientationProperty(position),
    model: {
      uri: "/models/Cesium_Air.glb",
      minimumPixelSize: 64,
      maximumScale: 20000,
      scale: 50,
    },
    path: {
      resolution: 1,
      material: new Cesium.PolylineGlowMaterialProperty({
        glowPower: 0.1,
        color: Cesium.Color.YELLOW,
      }),
      width: 3,
    },
  });

  cesiumV.trackedEntity = planeEntity;
}

// 创建动态 InfoBox 组件
function createDynamicInfoBox() {
  // 创建容器元素
  infoBoxContainer = document.createElement("div");
  infoBoxContainer.style.position = "absolute";
  infoBoxContainer.style.zIndex = "999";
  document.body.appendChild(infoBoxContainer);

  // 使用 watchEffect 响应式渲染组件
  watchEffect(() => {
    render(
      h(InfoBox, {
        title: "飞机信息",
        longitude: planePosition.value.longitude.toFixed(4),
        latitude: planePosition.value.latitude.toFixed(4),
        altitude: Math.round(planePosition.value.altitude),
      }),
      infoBoxContainer!,
    );
  });

  // 监听 preRender 更新位置
  removePreRenderListener = cesiumV.scene.preRender.addEventListener(() => {
    updateInfoBoxPosition();
  });
}

// 更新 InfoBox 位置
function updateInfoBoxPosition() {
  if (!planeEntity || !infoBoxContainer) return;

  const currentTime = cesiumV.clock.currentTime;
  const position = planeEntity.position?.getValue(currentTime);

  if (!position) {
    infoBoxContainer.style.display = "none";
    return;
  }

  // 将 Cartesian3 转换为屏幕坐标
  const canvasPosition = Cesium.SceneTransforms.worldToWindowCoordinates(
    cesiumV.scene,
    position,
  );

  if (!canvasPosition) {
    infoBoxContainer.style.display = "none";
    return;
  }

  // 更新容器位置
  infoBoxContainer.style.display = "block";
  infoBoxContainer.style.left = `${canvasPosition.x}px`;
  infoBoxContainer.style.top = `${canvasPosition.y}px`;
  infoBoxContainer.style.pointerEvents = "none";

  // 更新经纬度信息
  const cartographic = Cesium.Cartographic.fromCartesian(position);
  planePosition.value.longitude = Cesium.Math.toDegrees(cartographic.longitude);
  planePosition.value.latitude = Cesium.Math.toDegrees(cartographic.latitude);
  planePosition.value.altitude = cartographic.height;
}

// 清理资源
function cleanup() {
  if (removePreRenderListener) {
    removePreRenderListener();
    removePreRenderListener = null;
  }

  if (infoBoxContainer) {
    render(null, infoBoxContainer);
    infoBoxContainer.remove();
    infoBoxContainer = null;
  }

  if (planeEntity) {
    cesiumV.entities.remove(planeEntity);
    planeEntity = null;
  }
}

onMounted(() => {
  cesiumV = getCesiumViewer();
  createFlightPath();
  createDynamicInfoBox();
});

onUnmounted(() => {
  cleanup();
});
</script>

<style lang="scss" scoped>
#cesiumContainer {
  height: 100vh;
}
</style>
