<template>
    <div id="map" class="map"></div>
    <pre
        class="lonlat">经度:{{ Number(jw?.lng).toFixed(5) }} 纬度:{{ Number(jw?.lat).toFixed(5) }} 层级:{{ zoom.toFixed(1) }}</pre>
    <div class="box" @click="addCustom">飞机</div>
</template>

<script setup lang="ts">
import { onMounted, ref, onUnmounted } from 'vue'
import mapbox from 'mapbox-gl';
import { Threebox } from 'threebox-plugin';

let mapR: mapboxgl.Map;
let tb;

onMounted(() => {
    initMap()
})

onUnmounted(() => {
    mapR.remove()
})

//当前经纬度
const jw = ref<{ lat: number, lng: number }>({ lat: 0, lng: 0 });

//当前缩放层级
const zoom = ref<Number>(0)


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
    tb = window.tb = new Threebox(
        map,
        map.getCanvas().getContext('webgl'), //get the context from the map canvas
        { defaultLights: true }
    );
    map.on('mousemove', (e: { lngLat: { lat: number, lng: number } }) => {
        jw.value = e.lngLat;
    })

    map.on('zoom', () => {
        zoom.value = map.getZoom() as Number;
    })
}

const addCustom = () => {
    mapR.addLayer({
        id: 'box1',
        type: 'custom',
        onAdd: function (map, gl) {

        },
        render: function (gl, matrix) {

        }
    })
}



</script>

<style lang="scss" scoped>
.map {
    height: 100vh;
}

.lonlat {
    z-index: 9;
    width: 320px;
    font-size: 15px;
    line-height: 35px;
    padding: 0 3px;
    height: 35px;
    background-color: rgb(191, 192, 192);
    position: absolute;
    bottom: 3%;
    left: 3%;
    text-align: center;
}

.box {
    width: 50px;
    height: 50px;
    text-align: center;
    position: absolute;
    left: 1%;
    bottom: 10%;
    z-index: 9;
    background-color: red;
}
</style>
