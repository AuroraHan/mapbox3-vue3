<template>
  <div id="cesiumContainer"></div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted } from "vue";
import * as Cesium from "cesium";
import { useCesium } from "@/hooks/useCesium";

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

// 创建飞机飞行路线
function createFlightPath() {
  const position = new Cesium.SampledPositionProperty();

  const startTime = cesiumV.clock.currentTime;

  // 每个关键点间隔5秒
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

  // 设置插值使轨迹平滑
  // position.setInterpolationOptions({
  //   interpolationDegree: 2,
  //   interpolationAlgorithm: Cesium.InterpolationAlgorithm,
  // });

  // 创建飞机实体
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

  // 相机跟随飞机
  cesiumV.trackedEntity = planeEntity;
}

onMounted(() => {
  cesiumV = getCesiumViewer();
  createFlightPath();
});

onUnmounted(() => {
  if (planeEntity) {
    cesiumV.entities.remove(planeEntity);
  }
});
</script>

<style lang="scss" scoped>
#cesiumContainer {
  height: 100vh;
}
</style>
