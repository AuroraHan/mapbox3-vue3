<template>
    <div id="map">
    </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import mapbox from 'mapbox-gl';

let mapR: mapboxgl.Map | null = null;

onMounted(() => {
    initMap()
})

onUnmounted(() => {
    mapR?.remove()
    mapR = null;
})

const initMap = () => {
    mapbox.accessToken = "pk.eyJ1IjoiaHBqbmYiLCJhIjoiY20yMzU5OGhzMDI2NjJrb2kweG5yYWRuZSJ9.HX3dEC4HuYwKuA3_Fm2wXA";
    const map = new mapbox.Map({
        container: 'map',
        projection: "mercator",
        style: 'mapbox://styles/mapbox/outdoors-v12',
        center: [120, 30],
        zoom: 2,
    })

    mapR = map;
    map.on('load', () => {

    })
}


</script>

<style scoped>
#map {
    height: 100vh;
}
</style>