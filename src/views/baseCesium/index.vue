<template>
    <div style="width: 100%; height: 100%;">
        <div id="cesiumContainer"></div>
    </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import * as Cesium from 'cesium';

onMounted(() => {
    const viewer = new Cesium.Viewer('cesiumContainer');
})

</script>

<style scoped></style>