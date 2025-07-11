<template>
    <div id="map"></div>
    <!-- <div class="box"></div> -->
</template>

<script setup lang="ts">
import { onMounted, createApp } from 'vue';
import mapbox from 'mapbox-gl';
import MPop from './mPop.vue';
import emitter from '/@/mitt/index';
import * as Turf from '@turf/turf'
import { useMapbox } from '../../hooks/useMapBox'
import CitySelectorControl from '/@/utils/CitySelectorControl'
import '/@/utils/CitySelectorControl/style.css'

let mapR: mapboxgl.Map | null = null;
const { getMap } = useMapbox({ container: 'map', isOffline: false })
onMounted(() => {
    proConfig()
})

//基础配置
const proConfig = () => {
    mapR = getMap()
    mapR?.on('load', () => {
        mapR?.addControl(new CitySelectorControl({
            theme: 'dark',
            placeholder: '全国',
            hot: ['110000'],
            zoom: 12
        }), 'top-right');
    })

    mapR?.on('click', (e) => {
        // customPopup([e.lngLat.lng, e.lngLat.lat])
    })

}

//接受事件
emitter.on('test', (e: any) => {
    console.log(e, 'gggggg');
})


//自定义弹出框
const customPopup = (e: any) => {
    let popup = new mapbox.Popup()
    const container = document.createElement('div')
    createApp(MPop, { title: 'gggg' }).mount(container)
    popup.setLngLat(e).setDOMContent(container).addTo(mapR!)
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