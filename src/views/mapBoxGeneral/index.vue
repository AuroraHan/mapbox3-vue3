<template>
    <div id="map"></div>
    <!-- <div class="box"></div> -->
</template>

<script setup lang="ts">
import { onMounted, createApp } from 'vue';
import mapbox from 'mapbox-gl';
import MPop from './mPop.vue';
import emitter from '@/mitt/index';
import * as Turf from '@turf/turf'
import { useMapbox } from '../../hooks/useMapBox'
import CitySelectorControl from '@/utils/CitySelectorControl'
import '@/utils/CitySelectorControl/style.css'

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

        addPoint()
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


//====
const data = [
    {
        lonlat: [117.4709043314002, 23.86973465030601],
        value: '-0.195',
        id: 196,
        type: 'A'
    },
    {
        lonlat: [117.5100956685998, 23.815682674846997],
        value: '0.492',
        id: 493,
        type: 'B'
    },
    {
        lonlat: [117.4905, 23.80667401227049],
        value: '0.262',
        id: 262,
        type: 'C'
    },
    {
        lonlat: [117.4807021657001, 23.80667401227049],
        value: '0.0219',
        id: 22,
        type: 'D'
    },
    {
        lonlat: [117.4709043314002, 23.80667401227049],
        value: '0.0115',
        id: 11,
        type: 'E'
    },
    {
        lonlat: [117.4513086628004, 23.815682674846997],
        value: '0.001',
        id: 1,
        type: 'F'
    },
    {
        lonlat: [117.51989350289968, 23.842708662576506],
        value: '0.003',
        id: 3,
        type: 'G'
    },
    {
        lonlat: [117.4513086628004, 23.86072598772951],
        value: '-0.004',
        id: 4,
        type: 'H'
    },
    {
        lonlat: [117.4611064971003, 23.86973465030601],
        value: '-0.004',
        id: 40,
        type: 'H'
    },
    {
        lonlat: [117.51989350289968, 23.8337],
        value: '0.0052',
        id: 5,
        type: 'I'
    },
    {
        lonlat: [117.5002978342999, 23.80667401227049],
        value: '0.016',
        id: 16,
        type: 'J'
    },
    {
        lonlat: [117.5002978342999, 23.86973465030601],
        value: '-0.635',
        id: 636,
        type: 'K'
    }
]
const addPoint = () => {
    const geojson = {
        type: 'FeatureCollection',
        features: [] as any
    }

    for (const element of data) {
        geojson.features.push({
            "type": "Feature",
            "properties": Object.assign({}, element),
            "geometry": {
                "type": "Point",
                "coordinates": element.lonlat
            }
        })
    }

    mapR?.addLayer({
        id: 'gg',
        source: {
            type: 'geojson',
            data: geojson
        },
        type: 'circle',
        paint: {
            'circle-color': [  // 如果是circle，使用'circle-color'
                'match',
                ['get', 'type'],
                'A', '#ff0000',  // 红色
                'B', '#00ff00',  // 绿色
                'C', '#0000ff',  // 蓝色
                'D', '#ffff00',  // 黄色
                'E', '#ff00ff',  // 紫色
                'F', '#00ffff',  // 青色
                'G', '#ff9900',  // 橙色
                'H', '#990077',  // 紫罗兰色
                'I', '#009900',  // 深绿色
                'J', '#000099',  // 深蓝色
                'K', '#990000',  // 深红色
                '#cccccc'        // 默认灰色
            ],
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