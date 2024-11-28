<template>
    <div id="map" class="map">

    </div>
    <pre
        class="lonlat">经度:{{ Number(jw?.lng).toFixed(5) }} 纬度:{{ Number(jw?.lat).toFixed(5) }} 层级:{{ zoom.toFixed(1) }}</pre>
    <div class="box" @click="addGeoJson">json
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref, onUnmounted } from 'vue'
import mapbox from 'mapbox-gl';

let mapR: mapboxgl.Map;

//当前经纬度
const jw = ref<{ lat: number, lng: number }>({ lat: 0, lng: 0 });

//当前缩放层级
const zoom = ref<Number>(0)

onMounted(() => {
    initMap()
})

onUnmounted(() => {
    mapR.remove()
})


const initMap = () => {
    mapbox.accessToken = "pk.eyJ1IjoiaHBqbmYiLCJhIjoiY20yMzU5OGhzMDI2NjJrb2kweG5yYWRuZSJ9.HX3dEC4HuYwKuA3_Fm2wXA";
    const map = new mapbox.Map({
        container: 'map',
        projection: "mercator",
        style: 'mapbox://styles/mapbox/outdoors-v12',
        // style: {
        //     version: 8,
        //     sources: {
        //         m_mono: {
        //             type: "raster",
        //             tiles: ["/tile/google/{z}/{x}/{y}.jpg"],
        //             tileSize: 256,
        //             attribution: "",
        //         },
        //     },
        //     glyphs: "../../static/glyphs/{fontstack}/{range}.pbf",
        //     layers: [
        //         {
        //             id: "m_mono",
        //             type: "raster",
        //             source: "m_mono",
        //             minZoom: 0,
        //             maxZoom: 18,
        //         },
        //     ],
        //     fog: {
        //         range: [0.8, 8],
        //         color: '#e6ddec',
        //         "horizon-blend": 0.1
        //     }
        // },
        center: [120, 30],
        zoom: 2,
    })

    mapR = map;
    map.on('load', () => {

    })

    map.on('mousemove', (e: { lngLat: { lat: number, lng: number } }) => {
        jw.value = e.lngLat;
    })

    map.on('zoom', () => {
        zoom.value = map.getZoom() as Number;
    })

    map.on('moveend', () => {
    })
}


//添加外部geojson
const addGeoJson = () => {
    mapR.flyTo({
        center: [
            106.59223698054778,
            26.60328385825539
        ],
        zoom: 12
    })
    mapR.addSource('china', {
        type: 'geojson',
        // data: {
        //     "type": "FeatureCollection",
        //     "features": [
        //         {
        //             "geometry": {
        //                 "coordinates": [
        //                     [
        //                         [
        //                             106.59223698054778,
        //                             26.60328385825539
        //                         ],
        //                         [
        //                             106.59223698054778,
        //                             26.60239444125045
        //                         ],
        //                         [
        //                             106.59323209435092,
        //                             26.60239444125045
        //                         ],
        //                         [
        //                             106.59323209435092,
        //                             26.60328385825539
        //                         ],
        //                         [
        //                             106.59223698054778,
        //                             26.60328385825539
        //                         ]
        //                     ]
        //                 ],
        //                 "type": "Polygon"
        //             },
        //             "id": "712db75a-d59f-476a-b9f7-2fb69e8bee2a",
        //             "type": "Feature",
        //             "properties": {
        //                 "Conc": 1875.9
        //             }
        //         },
        //     ]
        // }
        data: './geojson/Geo.geojson',
    })

    mapR.addLayer({
        id: 'china',
        source: 'china',
        type: 'fill',
        minzoom: 2,
        maxzoom: 18,
        'paint': {
            'fill-color': '#ff0000', // blue color fill
            'fill-opacity': 0.6,
            "fill-outline-color": '#000000'
        }
    })


    // mapR.addLayer({
    //     'id': 'outline',
    //     'type': 'line',
    //     'source': 'china',
    //     'layout': {},
    //     'paint': {
    //         'line-color': '#ffff00',
    //         'line-width': 1
    //     }
    // });
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
