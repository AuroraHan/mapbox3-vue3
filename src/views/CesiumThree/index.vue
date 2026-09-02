<template>
  <div id="cesiumContainer">
    <div class="options">
      <div class="section">
        <h4>GeoJSON 加载方式</h4>
        <button @click="loadByEntities">方式一: Entities 实体</button>
        <button @click="loadByRectangle">方式二: Rectangle 实体</button>
        <button @click="loadByImageryLayer">方式三: 影像图层</button>
      </div>
      <div class="section" v-if="currentMethod">
        <h4>动画控制</h4>
        <button @click="playAnimation">播放</button>
        <button @click="stopAnimation">停止</button>
        <span>当前小时: {{ currentHour }}</span>
      </div>
      <button @click="clearAll">清除所有</button>
    </div>
    <!-- 悬浮提示框：鼠标移入影像图层时展示该点的数值 -->
    <div
      v-if="tooltip.show"
      class="hover-tooltip"
      :style="{ left: tooltip.x + 10 + 'px', top: tooltip.y + 10 + 'px' }"
    >
      {{ tooltip.text }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import * as Cesium from "cesium";
import { useCesium } from "@/hooks/useCesium";
import {
  fetchGeoJson,
  getColorForEntity,
  buildHourMap,
  computeBounds,
  precomputeCanvas,
  createRectangle,
  createFlyToPosition,
  createSingleTileProvider,
  findFeatureAtPoint,
  type GeoBounds,
  createEmptyBounds,
} from "./utils";

// ==================== 基础配置 ====================
let cesiumV: Cesium.Viewer;
const currentHour = ref(1);
const currentMethod = ref<string>("");
let timer: any = null;

const { getCesiumViewer } = useCesium({
  container: "cesiumContainer",
  addTerrain: true,
  infoBox: false,
  shouldAnimate: true,
});

onMounted(() => {
  cesiumV = getCesiumViewer();
});

// ==================== 方式一: Entities 实体直接加载 ====================

/**
 * 方式一: 使用 Entities 直接加载 GeoJSON 多边形
 *
 * 特点:
 * - 最简单直接的方式
 * - 每个多边形作为独立实体
 * - 适合少量数据、需要交互选中单个要素的场景
 * - 不会贴合地形，多边形在地球表面上方
 */
const loadByEntities = async () => {
  clearAll();
  currentMethod.value = "entities";

  const geojson = await fetchGeoJson();
  renderPolygonsAsEntities(geojson.features);

  cesiumV.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(
      122.48450369499642,
      36.982489271601295,
      10000,
    ),
    duration: 2,
  });
};

/**
 * 渲染多边形实体
 */
const renderPolygonsAsEntities = (features: any[]) => {
  features.forEach((f) => {
    cesiumV.entities.add({
      id: `entity-${f.properties.Hour}-${f.properties.Conc}`,
      polygon: {
        hierarchy: Cesium.Cartesian3.fromDegreesArray(
          f.geometry.coordinates[0].flat(),
        ),
        material: getColorForEntity(f.properties.Conc),
        perPositionHeight: false,
      },
      properties: {
        hour: f.properties.Hour,
        conc: f.properties.Conc,
      },
    });
  });
};

// ==================== 方式二: Rectangle 实体 + Canvas ====================

/**
 * 方式二: 使用 Rectangle 实体承载 Canvas 热力图
 *
 * 特点:
 * - 将 GeoJSON 数据绘制到 Canvas 上
 * - Canvas 作为材质贴到 Rectangle 实体
 * - 支持时间序列动画
 * - 不会贴合地形，悬浮在地球表面
 */

let rectangleEntity: Cesium.Entity | null = null;
let hourMapForRectangle = new Map<number, any[]>();
let canvasCacheForRectangle = new Map<number, HTMLCanvasElement>();
let boundsForRectangle: GeoBounds = createEmptyBounds();

const loadByRectangle = async () => {
  clearAll();
  currentMethod.value = "rectangle";

  const geojson = await fetchGeoJson();

  // 按时间分组
  hourMapForRectangle = buildHourMap(geojson);

  // 计算范围
  boundsForRectangle = computeBounds(geojson);

  // 预计算所有 Canvas
  canvasCacheForRectangle = await precomputeCanvas(
    hourMapForRectangle,
    boundsForRectangle,
  );

  // 创建 Rectangle 实体
  rectangleEntity = cesiumV.entities.add({
    rectangle: {
      coordinates: createRectangle(boundsForRectangle),
      material: new Cesium.ImageMaterialProperty({
        image: canvasCacheForRectangle.get(currentHour.value)!,
        transparent: true,
      }),
    },
  });

  cesiumV.camera.flyTo({
    destination: createFlyToPosition(boundsForRectangle),
    duration: 2,
  });
};

/**
 * 更新 Rectangle 的 Canvas 材质
 */
const updateRectangleCanvas = (hour: number) => {
  if (!rectangleEntity) return;
  const canvas = canvasCacheForRectangle.get(hour);
  if (!canvas) return;
  (rectangleEntity.rectangle!.material as Cesium.ImageMaterialProperty).image =
    canvas;
};

// ==================== 方式三: 影像图层 + Canvas ====================

/**
 * 方式三: 使用影像图层承载 Canvas 热力图
 *
 * 特点:
 * - 将 Canvas 转为 SingleTileImageryProvider
 * - 影像图层自动贴合地形
 * - 每个时间点一个图层，通过 show 属性切换
 * - 适合大数据量、需要贴合地形的场景
 */

let hourMapForImagery = new Map<number, any[]>();
let canvasCacheForImagery = new Map<number, HTMLCanvasElement>();
let boundsForImagery: GeoBounds = createEmptyBounds();
const layerMap = new Map<number, Cesium.ImageryLayer>();
let currentLayer: Cesium.ImageryLayer | null = null;

// 悬浮提示框状态：影像图层没有原生拾取能力，靠鼠标位置反查经纬度实现
let hoverHandler: Cesium.ScreenSpaceEventHandler | null = null;
const tooltip = ref({ show: false, x: 0, y: 0, text: "" });

const loadByImageryLayer = async () => {
  clearAll();
  currentMethod.value = "imagery";

  const geojson = await fetchGeoJson();

  // 按时间分组
  hourMapForImagery = buildHourMap(geojson);

  // 计算范围
  boundsForImagery = computeBounds(geojson);

  // 预计算所有 Canvas
  canvasCacheForImagery = await precomputeCanvas(
    hourMapForImagery,
    boundsForImagery,
  );

  // 创建影像图层
  createImageryLayers();

  // 显示第一个时间点
  showImageryLayer(currentHour.value);

  // 开启鼠标悬浮拾取数值
  enableHoverPick();

  cesiumV.camera.flyTo({
    destination: createFlyToPosition(boundsForImagery),
    duration: 2,
  });
};

/**
 * 创建所有影像图层
 */
const createImageryLayers = () => {
  canvasCacheForImagery.forEach((canvas, hour) => {
    const provider = createSingleTileProvider(canvas, boundsForImagery);
    const layer = cesiumV.imageryLayers.addImageryProvider(provider);
    layer.show = hour === currentHour.value;
    layerMap.set(hour, layer);
  });
  currentLayer = layerMap.get(currentHour.value) || null;
};

/**
 * 显示指定时间点的影像图层
 */
const showImageryLayer = (hour: number) => {
  if (currentLayer) {
    currentLayer.show = false;
  }
  currentLayer = layerMap.get(hour) || null;
  if (currentLayer) {
    currentLayer.show = true;
  }
};

/**
 * 开启鼠标悬浮拾取
 *
 * 原理：
 * SingleTileImageryProvider 只是一张贴图，Cesium 无法像 Entity/Primitive
 * 那样直接 pick 出对应的 feature。所以这里换一种思路：
 * 1. 监听 MOUSE_MOVE，用 camera.pickEllipsoid 把屏幕坐标反算成椭球面上的经纬度
 * 2. 拿当前小时对应的原始 GeoJSON 要素（未经 Canvas 栅格化），
 *    用 findFeatureAtPoint 做点在多边形内的命中测试
 * 3. 命中则展示该 feature 的 Conc 属性值，未命中则隐藏提示框
 */
const enableHoverPick = () => {
  hoverHandler = new Cesium.ScreenSpaceEventHandler(cesiumV.canvas);

  hoverHandler.setInputAction(
    (movement: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
      const cartesian = cesiumV.camera.pickEllipsoid(
        movement.endPosition,
        cesiumV.scene.globe.ellipsoid,
      );

      if (!cartesian) {
        tooltip.value.show = false;
        return;
      }

      const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
      const lon = Cesium.Math.toDegrees(cartographic.longitude);
      const lat = Cesium.Math.toDegrees(cartographic.latitude);

      const features = hourMapForImagery.get(currentHour.value);
      const feature = features ? findFeatureAtPoint(lon, lat, features) : null;

      if (feature) {
        tooltip.value.show = true;
        tooltip.value.x = movement.endPosition.x;
        tooltip.value.y = movement.endPosition.y;
        tooltip.value.text = `Conc: ${feature.properties.Conc}`;
      } else {
        tooltip.value.show = false;
      }
    },
    Cesium.ScreenSpaceEventType.MOUSE_MOVE,
  );
};

/**
 * 关闭鼠标悬浮拾取，销毁事件监听并隐藏提示框
 */
const disableHoverPick = () => {
  if (hoverHandler) {
    hoverHandler.destroy();
    hoverHandler = null;
  }
  tooltip.value.show = false;
};

// ==================== 动画控制 ====================

/**
 * 播放时间序列动画
 */
const playAnimation = () => {
  if (timer) return;

  timer = setInterval(() => {
    currentHour.value++;
    if (currentHour.value > 5) {
      currentHour.value = 1;
    }

    if (currentMethod.value === "rectangle") {
      updateRectangleCanvas(currentHour.value);
    } else if (currentMethod.value === "imagery") {
      showImageryLayer(currentHour.value);
    }
  }, 800);
};

/**
 * 停止动画
 */
const stopAnimation = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};

// ==================== 清理 ====================

/**
 * 清除所有加载的内容
 */
const clearAll = () => {
  stopAnimation();
  disableHoverPick();
  currentHour.value = 1;
  currentMethod.value = "";

  // 清除实体
  cesiumV.entities.removeAll();
  rectangleEntity = null;

  // 清除影像图层
  layerMap.forEach((layer) => {
    cesiumV.imageryLayers.remove(layer);
  });
  layerMap.clear();
  currentLayer = null;

  // 清除缓存
  hourMapForRectangle.clear();
  canvasCacheForRectangle.clear();
  hourMapForImagery.clear();
  canvasCacheForImagery.clear();

  // 重置范围
  boundsForRectangle = createEmptyBounds();
  boundsForImagery = createEmptyBounds();
};
</script>

<style scoped>
#cesiumContainer {
  height: 100vh;
  position: relative;
}

.options {
  position: absolute;
  left: 3%;
  top: 3%;
  z-index: 99;
  background: rgba(0, 0, 0, 0.7);
  padding: 15px;
  border-radius: 8px;
  color: white;
}

.section {
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
}

.section:last-of-type {
  border-bottom: none;
  margin-bottom: 10px;
}

h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #4fc3f7;
}

button {
  display: block;
  width: 100%;
  margin: 5px 0;
  padding: 8px 12px;
  background: #2196f3;
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  font-size: 13px;
}

button:hover {
  background: #1976d2;
}

button:active {
  background: #0d47a1;
}

span {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  color: #ccc;
}

.hover-tooltip {
  position: absolute;
  z-index: 100;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  font-size: 12px;
  border-radius: 4px;
  pointer-events: none;
  white-space: nowrap;
}
</style>
