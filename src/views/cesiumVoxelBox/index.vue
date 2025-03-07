<template>
    <!-- 体渲染 -->
    <div id="cesiumContainer"></div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import * as Cesium from 'cesium';

let cesiumV: Cesium.Viewer;

const initCesium = () => {
    Cesium.Ion.defaultAccessToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYTQ2ZjdjNS1jM2E0LTQ1M2EtOWM0My1mODMzNzY3YjYzY2YiLCJpZCI6MjkzMjcsInNjb3BlcyI6WyJhc3IiLCJnYyJdLCJpYXQiOjE1OTE5NDIzNjB9.RzKlVTVDTQ9r7cqCo-PDydgUh8Frgw0Erul_BVxiS9c";
    const viewer = new Cesium.Viewer("cesiumContainer", {
        baseLayerPicker: false,
        geocoder: false,
        animation: false,
        timeline: false,
    });

    cesiumV = viewer
}

onMounted(() => {
    initCesium()
    cesiumV.extend(Cesium.viewerVoxelInspectorMixin);
    cesiumV.scene.debugShowFramesPerSecond = true;

})

//创建球面的体渲染
const ellipsoid = () => {
    const provider = new ProceduralSingleTileVoxelProvider(
        Cesium.VoxelShapeType.ELLIPSOID,
    );

}

const customShaderColor = new Cesium.CustomShader({
    fragmentShaderText: `void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material)
  {
      
  }`,
});

const modelMatrix = Cesium.Matrix4.fromScale(
    Cesium.Cartesian3.fromElements(
        Cesium.Ellipsoid.WGS84.maximumRadius,
        Cesium.Ellipsoid.WGS84.maximumRadius,
        Cesium.Ellipsoid.WGS84.maximumRadius,
    ),
);

//定义颜色
const scratchColor = new Cesium.Color();
//创建体要素
class ProceduralSingleTileVoxelProvider {

    constructor(shape) {

    }

    // 生成体素数据并返回
    requestData(options) {
        if (options.tileLevel >= 1) {
            return Promise.reject(`No tiles available beyond level 0`);
        }

        // 在版本1.127中需要进行转换 这里容易报错
        const content = Cesium.VoxelContent.fromMetadataArray([dataColor]);
        return Promise.resolve(content);
    }
}


</script>

<style lang="scss" scoped>
#cesiumContainer {
    height: 100vh;
}
</style>