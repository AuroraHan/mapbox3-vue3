<template>
    <div id="map"></div>
    <div class="box"></div>
</template>

<script setup lang="ts">
import { onMounted, createApp } from 'vue';
import mapbox from 'mapbox-gl';
import MPop from './mPop.vue';
import emitter from '/@/mitt/index';
import * as Turf from '@turf/turf'
import { useMapbox } from '../../hooks/useMapBox'

let mapR: mapboxgl.Map | null = null;
const { getMap } = useMapbox({ container: 'map', isOffline: true })
onMounted(() => {
    proConfig()
})

//基础配置
const proConfig = () => {
    mapR = getMap()
    mapR?.on('load', () => {
        constLine()
    })

    mapR?.on('click', (e) => {
        customPopup([e.lngLat.lng, e.lngLat.lat])
    })

}

//接受事件
emitter.on('test', (e: any) => {
    console.log(e, 'gggggg');

})

const customPopup = (e: any) => {
    let popup = new mapbox.Popup()
    const container = document.createElement('div')
    createApp(MPop, { title: 'gggg' }).mount(container)
    popup.setLngLat(e).setDOMContent(container).addTo(mapR!)
}

//画线
const constLine = () => {
    const line = Turf.lineString([[112, 20], [117, 33]]);

    mapR?.addSource('cline', {
        type: 'geojson',
        data: line
    })

    mapR?.addLayer({
        id: 'cline',
        type: 'line',
        source: 'cline',
        paint: {
            'line-color': '#ffff00'
        }
    })
}


</script>

<style scoped>
#map {
    height: 100vh;
}

.box {
    position: absolute;
    left: 4%;
    top: 5%;
    z-index: 9;
    width: 100px;
    height: 30px;
    background-color: rgb(165, 233, 210);
    border-radius: 4px;
}
</style>