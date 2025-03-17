<!--  -->
<template>
    <h2 @click="open">基础空白页面</h2>
    <hr>
    <div>
        <img src="/images/fly.gif" alt="" srcset="">
    </div>

    <MapPopup @exportMap="exportMap" mapId='map-popup' :show="resultDialog" />
</template>

<script setup lang='ts'>
import { reactive, ref, onBeforeMount, onMounted } from 'vue'
import * as Turf from '@turf/turf'
import mapboxgl from "mapbox-gl";
//@ts-ignore
import MapPopup from '@/components/MapPopup/index.vue'

const resultDialog = ref(false)

const resResultDialog = ref<InstanceType<typeof MapPopup>>()

const open = () => {
    resultDialog.value = !resultDialog.value
}

const exportMap = (mapR, b) => {
    console.log(mapR, 'kkkk');
    addPoint(mapR)
}

const addPoint = (mapR: mapboxgl.Map) => {
    mapR.addSource('test', {
        type: 'geojson',
        data: Turf.point([113, 31])
    })

    mapR?.addLayer({
        id: 'test',
        source: 'test',
        type: 'circle',
        'paint': {
            'circle-color': '#ff0000', // blue color fill
        }
    })
}
</script>
<style scoped>
h2 {
    text-align: center;
}
</style>