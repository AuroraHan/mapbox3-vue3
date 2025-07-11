<!--  -->
<template>
    <div id="map" class="map"></div>
</template>

<script setup lang='ts'>
import { reactive, toRefs, onBeforeMount, onMounted } from 'vue'
import { useMapbox } from '../../hooks/useMapBox'


let mapR: mapboxgl.Map;

const { getMap } = useMapbox({ container: 'map', isOffline: false })

onMounted(() => {
    baseConfig()
})

//基础配置
const baseConfig = () => {
    mapR = getMap()!
}

</script>
<style scoped lang='scss'>
.map {
    height: 100vh;
}
</style>