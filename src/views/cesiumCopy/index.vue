<template>
  <div id="cesiumContainer">
    <div class="options">
      <button @click="addModel">添加模型</button>
    </div>
  </div>

  <div v-show="showBounding" class="bounding-box" ref="boundingBoxRef"></div>
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
  addModel();
  mouseleftAndRight();
  mouseRightMenu();
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

//鼠标右键菜单
const mouseRightMenu = () => {
  const canvas = cesiumV.scene.canvas;
  canvas.addEventListener("contextmenu", contextmenuEnevt);
};

const contextmenuEnevt = (e: PointerEvent) => {
  e.preventDefault();
  //通过屏幕坐标反向查找
  const can2 = new Cesium.Cartesian2(e.clientX, e.clientY);
  const pick = cesiumV.scene.pick(can2);
  if (pick) {
    const entity = pick.id;
    showBoundingBox(entity, e.clientX, e.clientY);
  }
};

const boundingBoxRef = ref();
const showBounding = ref(false);
//绘制包围的矩形
const showBoundingBox = (ent: Cesium.Entity, x: number, y: number) => {
  const mousePos = ent.position!._value;
  //将笛卡尔坐标转换为屏幕坐标
  const screenPos = Cesium.SceneTransforms.worldToWindowCoordinates(
    cesiumV.scene,
    mousePos,
  );

  const size = 20;
  //计算包围盒的宽度和高度
  boundingBoxRef.value.style.width = `${size}px`;
  boundingBoxRef.value.style.height = `${size}px`;
  boundingBoxRef.value.style.left = `${x - size / 2}px`;
  boundingBoxRef.value.style.top = `${y - size / 2}px`;
  showBounding.value = true;
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

.bounding-box {
  position: fixed;
  border: 2px solid red;
}
</style>
