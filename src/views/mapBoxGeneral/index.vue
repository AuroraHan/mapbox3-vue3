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
        loadData()
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

let droneData: Array<any> = []; // 存储无人机轨迹数据
const loadData = () => {
    fetch('/geojson/flypath.geojson')
        .then(response => response.json())
        .then(data => {
            droneData = data.features
                .map(f => ({
                    lng: f.geometry.coordinates[0],
                    lat: f.geometry.coordinates[1],
                    // alt: f.properties.altitude,
                    time: new Date(f.properties.timestamp).getTime()
                }))
                .sort((a, b) => a.time - b.time);

            initAnimation();
            // createTimelineControl();
        });
}

function initAnimation() {
    // 添加无人机模型源
    mapR?.addSource('drone', {
        type: 'geojson',
        data: {
            'type': 'Feature',
            'properties': {},
            'geometry': {
                'coordinates': [droneData[0].lng, droneData[0].lat],
                'type': 'Point'
            }
        }
    })

    mapR?.addLayer({
        'id': 'drone-model',
        'type': 'model',
        'source': 'drone',
        'layout': {
            'model-id': 'http://localhost:4000/models/CesiumDrone.glb'
            // 'model-id': 'https://docs.mapbox.com/mapbox-gl-js/assets/tower.glb'
        },
        'paint': {
            'model-opacity': 1,
            // 'model-rotation': [0.0, 0.0, 35.0],
            'model-scale': [100, 100, 100],
            // 'model-color-mix-intensity': 0,
            // 'model-cast-shadows': true,
            // 'model-emissive-strength': 0.8
        }
    });

    // 添加飞行路径线
    mapR?.addSource('flight-path', {
        type: 'geojson',
        data: {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: droneData.map(p => [p.lng, p.lat])
            }
        }
    });

    mapR?.addLayer({
        id: 'flight-path',
        type: 'line',
        source: 'flight-path',
        paint: {
            'line-color': '#ff0000',
            'line-width': 3
        }
    });
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