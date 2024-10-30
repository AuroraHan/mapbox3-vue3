<template>
    <div id="map">
    </div>
    <div class="container">
        <div class="map-item">
            测试地图1<el-switch v-model="map1" />
        </div>
        <div class="map-item">
            测试地图2<el-switch v-model="map1" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import mapbox from 'mapbox-gl';
import { latLonToWebMercator, webMercatorToLatLon } from '@/utils/mapTools'

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

    map.on('click', (e) => {
        console.log(e, 'kkk');
        // const nullIsland = new mapbox.MercatorCoordinate(30000, 30000, 0);
        // console.log(nullIsland);

        const res = latLonToWebMercator(e.lngLat.lng, e.lngLat.lat)
        console.log(res);
        const res1 = webMercatorToLatLon(res.x, res.y)
        console.log(res1);
    })
}

//
const map1 = ref(false)

</script>

<style scoped>
#map {
    height: 100vh;
}

.container {
    z-index: 9;
    width: 300px;
    height: 60%;
    position: absolute;
    right: 3%;
    top: 3%;
    background-color: rgba(188, 242, 224, 0.7);
    border-radius: 4px;
    padding: 10px 2px;
}

.map-item {
    line-height: 32px;
    display: flex;
    align-items: center;
    justify-content: space-around;
}
</style>