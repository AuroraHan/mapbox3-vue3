<template>
    <div id="map">
        <div class="box">WMS</div>
    </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import mapbox from 'mapbox-gl';

onMounted(() => {
    initMap()
})

/**
 * @type {mapboxgl.Map}
 */
let mapR;

const initMap = () => {
    mapbox.accessToken = "pk.eyJ1IjoiaHBqbmYiLCJhIjoiY20yMzU5OGhzMDI2NjJrb2kweG5yYWRuZSJ9.HX3dEC4HuYwKuA3_Fm2wXA";
    const map = new mapbox.Map({
        container: 'map',
        projection: "globe",
        // style: 'mapbox://styles/mapbox/outdoors-v12',
        style: {
            version: 8,
            sources: {
                m_mono: {
                    type: "raster",
                    tiles: ["/tile/google/{z}/{x}/{y}.jpg"],
                    tileSize: 256,
                    attribution: "",
                },
            },
            glyphs: "../../static/glyphs/{fontstack}/{range}.pbf",
            layers: [
                {
                    id: "m_mono",
                    type: "raster",
                    source: "m_mono",
                    minZoom: 0,
                    maxZoom: 18,
                },
            ],
            fog: {
                range: [0.8, 8],
                color: '#e6ddec',
                "horizon-blend": 0.1
            }
        },
        center: [120, 30],
        zoom: 2,
    })

    mapR = map;
    map.on('load', () => {

    })

}

const addWmsServer = () => {
    mapR.addSource('wms-china', {
        type: 'raster',
        tiles: [
            '/geoserverApi/geoserver/cite/wms?service=WMS&version=1.1.0&request=GetMap&layers=cite%3Aworld_50M&bbox={bbox-epsg-3857}&width=768&height=384&srs=EPSG%3A4326&styles=&format=image%2Fjpeg'
        ],
        tileSize: 512
    })

    mapR.addLayer({
        id: 'wms-china',
        type: 'raster',
        source: 'wms-china',
        // 'source-layer':''
        paint: {
            // "raster-opacity": 1
        }
    })
}

const addTmsServer = () => {
    mapR.addLayer({
        id: 'tms-china',
        type: 'line',
        source: {
            scheme: 'tms',
            type: 'vector',
            tiles: [
                '/geoserverApi/geoserver/gwc/service/tms/1.0.0/cite%3Achina-g@EPSG%3A4326@pbf/{z}/{x}/{y}.pbf'
            ]
        },
        "source-layer": 'tms-china',
        paint: {
            "line-color": '#ff0000'
        }
    })
}
// '/geoserverApi/geoserver/cite/wms?service=WMS&version=1.1.0&request=GetMap&layers=cite%3Aworld_50M&bbox=$sw_lng$,$sw_lat$,$ne_lng$,$ne_lat$&width=768&height=384&srs=EPSG%3A4326&styles=&format=geojson'

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
