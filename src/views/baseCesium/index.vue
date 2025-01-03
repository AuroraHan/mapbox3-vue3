<template>
    <div id="cesiumContainer"></div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import * as Cesium from 'cesium';
import { useCesium } from '../../hooks/useCesium'

let cesiumV: Cesium.Viewer;
const { getCesiumViewer } = useCesium({ container: 'cesiumContainer' })

onMounted(() => {
    cesiumV = getCesiumViewer()
    addBuilding()

})

//添加建筑物
const addBuilding = async () => {
    const tilesetBuild = await Cesium.createOsmBuildingsAsync()
    cesiumV.scene.primitives.add(tilesetBuild)
}

</script>

<style scoped></style>