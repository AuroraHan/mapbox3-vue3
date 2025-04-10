<!--  -->
<template>
    <div id="map" class="map"></div>
</template>

<script setup lang='ts'>
import { reactive, toRefs, onBeforeMount, onMounted } from 'vue'
import { useMapbox } from '../../hooks/useMapBox'

let mapR: mapboxgl.Map;

onMounted(() => {
    baseConfig()
})

const { getMap } = useMapbox({ container: 'map', isOffline: false })

const baseConfig = () => {
    mapR = getMap()!
}
</script>
<style scoped lang='scss'>
@import './index.scss';
</style>