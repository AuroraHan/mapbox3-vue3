<template>
    <div id="map"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import mapbox, { CustomLayerInterface } from 'mapbox-gl';
import { useMapbox } from '../../hooks/useMapBox'

let mapR: mapboxgl.Map | null = null;
const { getMap } = useMapbox({ container: 'map' })

onMounted(() => {
    mapR = getMap()
})

onUnmounted(() => {
    mapR?.remove()
    mapR = null;
})


</script>

<style scoped>
#map {
    height: 100vh;
}

.container {
    z-index: 9;
    width: 300px;
    height: 60%;
    position: absolute;
    right: 3%;
    top: 3%;
    background-color: rgba(188, 242, 224, 0.7);
    border-radius: 4px;
    padding: 10px 2px;
}

.map-item {
    line-height: 32px;
    display: flex;
    align-items: center;
    justify-content: space-around;
}
</style>