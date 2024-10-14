<template>
    <div id="map">

    </div>
</template>

<script setup>
import { onMounted, createApp } from 'vue';
import mapbox from 'mapbox-gl';
import MPop from './mPop.vue';
import emitter from '@/mitt/index';


/**
 * @type {mapboxgl.Map}
 */
let mapR;

onMounted(() => {
    initMap()
})


const initMap = () => {
    mapbox.accessToken = "pk.eyJ1IjoiaHBqbmYiLCJhIjoiY20yMzU5OGhzMDI2NjJrb2kweG5yYWRuZSJ9.HX3dEC4HuYwKuA3_Fm2wXA";
    const map = new mapbox.Map({
        container: 'map',
        projection: "globe",
        style: 'mapbox://styles/mapbox/outdoors-v12',
        center: [120, 30],
        zoom: 2,
    })

    mapR = map;
    map.on('load', () => {

    })

    map.on('click', (e) => {
        customPopup([e.lngLat.lng, e.lngLat.lat])
    })

}

emitter.on('test', (e) => {
    console.log(e, 'gggggg');

})

const customPopup = (e) => {
    let popup = new mapbox.Popup()
    const container = document.createElement('div')
    createApp(MPop, { title: 'gggg' }).mount(container)
    popup.setLngLat(e).setDOMContent(container).addTo(mapR)
}


</script>

<style scoped>
#map {
    height: 100vh;
}
</style>