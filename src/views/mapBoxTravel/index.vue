<template>
    <div id="map" class="map"></div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useMapbox } from '/@/hooks/useMapBoxLine'

let mapR: mapboxgl.Map;
const { getMap } = useMapbox({ container: 'map', isOffline: false })

onMounted(() => {
    baseConfig()
})

const baseConfig = () => {
    mapR = getMap()!
}

</script>

<style lang="scss" scoped>
.map {
    height: 100vh;
}
</style>