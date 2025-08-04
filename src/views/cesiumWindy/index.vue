<template>
    <div id="cesiumContainer"></div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive } from 'vue';
import * as Cesium from 'cesium';
import { useCesium } from '../../hooks/useCesium'

let cesiumV: Cesium.Viewer;
const { getCesiumViewer } = useCesium({ container: 'cesiumContainer', infoBox: false, shouldAnimate: true })

onMounted(() => {
    cesiumV = getCesiumViewer()
})
</script>

<style scoped>
#cesiumContainer {
    height: 100vh;
}
</style>