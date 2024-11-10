<template>
    <div id="map">
        <div class="box" @click="addGeoJson">WMS</div>
    </div>
</template>

<script setup>
import { onMounted, ref, } from 'vue'
import mapbox from 'mapbox-gl';

onMounted(() => {
    initMap()
})

/**
 * @type {mapboxgl.Map}
 */
let mapR;

let china = '/geoserverApi/geoserver/cite/wms?service=WMS&version=1.1.0&request=GetMap&layers=cite%3Achina-g&bbox=$sw_lng$,$sw_lat$,$ne_lng$,$ne_lat$&width=768&height=444&srs=EPSG%3A4326&styles=&format=geojson'
let world = '/geoserverApi/geoserver/cite/wms?service=WMS&version=1.1.0&request=GetMap&layers=cite%3Aworld_50M&bbox=$sw_lng$,$sw_lat$,$ne_lng$,$ne_lat$&width=768&height=384&srs=EPSG%3A4326&styles=&format=image/jpeg'
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

    map.on('style.load', () => {
        map.setConfigProperty('basemap', 'lightPreset', 'dusk');
        map.setConfigProperty('basemap', 'showPointOfInterestLabels', true);
    });

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

    mapR

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

<style scoped>
#map {
    height: 100vh;
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
