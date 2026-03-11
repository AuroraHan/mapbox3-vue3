<template>
    <div id="cesiumContainer"></div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue';
import * as Cesium from 'cesium';
import { useCesium } from '@/hooks/useCesium'


let cesiumV: Cesium.Viewer;
const { getCesiumViewer } = useCesium({ container: 'cesiumContainer', addTerrain: false, infoBox: false, shouldAnimate: true })
onMounted(() => {
    cesiumV = getCesiumViewer()
    addModel()
})

//添加模型
const addModel = () => {
    const modelEntity = cesiumV.entities.add({
        name: 'Cesium Air',
        position: Cesium.Cartesian3.fromDegrees(120, 30, 0),
        model: {
            uri: '/models/Cesium_Air.glb',
            minimumPixelSize: 128,
            maximumScale: 20000
        }
    });
    cesiumV.trackedEntity = modelEntity;
}

</script>

<style scoped>
#cesiumContainer {
    height: 100vh;
}
</style>