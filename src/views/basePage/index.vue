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
import { Scene, HeatmapLayer } from '@antv/l7'
//@ts-ignore
import MapPopup from '@/components/MapPopup/index.vue'

const resultDialog = ref(false)

const resResultDialog = ref<InstanceType<typeof MapPopup>>()

const open = () => {
    resultDialog.value = !resultDialog.value
}

const exportMap = (mapR, sceneL7) => {
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

const cul = (height) => {
    let value = Number((height + 10000) * 10)
    let R = Math.floor(value / 65536)
    let G = Math.floor((value % 65536) / 256)
    let B = value % 256

    return [R, G, B]
}

const dd = () => {
    const h = [
        0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000
    ]

    const result: any = []

    for (let index = 0; index < h.length; index++) {
        const element = h[index];
        result.push({
            name: element,
            value: cul(element)
        })
    }

    console.log(result);

}

dd()
</script>
<style scoped>
h2 {
    text-align: center;
}
</style>