<template>
    <div id="map"></div>
    <div class="box" @click="handlerData"></div>
</template>

<script setup>
import { onMounted, createApp } from 'vue';
import mapbox from 'mapbox-gl';
import MPop from './mPop.vue';
import emitter from '@/mitt/index';
import * as Turf from '@turf/turf'

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
        projection: "mercator",
        style: 'mapbox://styles/mapbox/dark-v11',//mapbox://styles/mapbox/outdoors-v12
        center: [125.7182120747035, 39.8251270095359],
        zoom: 10,
    })

    mapR = map;
    map.on('load', () => {

        // map.addSource('mapbox-dem', {
        //     'type': 'raster-dem',
        //     'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
        //     'tileSize': 512,
        //     'maxzoom': 14
        // });
        // // add the DEM source as a terrain layer with exaggerated height
        // map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
        windaGeoJsonOrg()
        constLine()
    })

    map.on('click', (e) => {
        // customPopup([e.lngLat.lng, e.lngLat.lat])
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

//画线
const constLine = () => {
    const line = Turf.lineString([[84.64610, 39.20350], [84.70405, 39.20302]]);

    mapR.addSource('cline', {
        type: 'geojson',
        data: line
    })

    mapR.addLayer({
        id: 'cline',
        type: 'line',
        source: 'cline',
        paint: {
            'line-color': '#ffff00'
        }
    })
}

const filterGeoJson = async (filename) => {
    //整体核素文件获取
    const jxProm = await fetch(filename).then((res) => {
        return res.json()
    });

    const time1 = jxProm.features.filter((ele) => {
        return ele.properties.Hour == 9 && ele.properties.Nu == 'Cs137';
    });

    // 创建线段
    const line = Turf.lineString([[84.64610, 39.20350], [84.70405, 39.20302]]);

    // 准备结果集合
    const intersectingFeatures = {
        type: 'FeatureCollection',
        features: []
    };


    // 检查每个多边形是否与线段相交
    time1.forEach(feature => {
        if (feature.geometry.type === 'Polygon') {
            if (Turf.booleanIntersects(line, feature)) {
                intersectingFeatures.features.push(feature);
            }
        }
    });
    console.log(intersectingFeatures);


    return intersectingFeatures
}

const findOverlappingPolygons = (winds, linux) => {
    const result = []
    const resultW = []
    const resultL = []

    winds.features.forEach((feature1) => {
        linux.features.forEach((feature2) => {
            if (feature1.properties.x == feature2.properties.x && feature1.properties.y == feature2.properties.y) {
                result.push({
                    x: feature1.properties.x,
                    y: feature1.properties.y,
                    window: feature1.properties.Conc,
                    linux: feature2.properties.Conc
                })
                resultW.push(feature1)
                resultL.push(feature2)
            }
        })
    })

    return result
}

const handlerData = async () => {
    const w = await filterGeoJson('/geojson/conc-time-winds2.geojson')
    windaGeoJson(w)
    const l = await filterGeoJson('/geojson/conc-time-linux2.geojson')

    const result = findOverlappingPolygons(w, l)
    console.table(result)
    // 获取所有可能的列标题
    const headers = Object.keys(result[0]);

    // 创建CSV内容
    let csvContent = headers.join(',') + '\n';

    result.forEach(row => {
        const rowValues = headers.map(header => {
            // 处理值中的逗号和换行符，用双引号包裹
            const value = row[header] !== undefined ? row[header] : '';
            return `"${String(value).replace(/"/g, '""')}"`;
        });
        csvContent += rowValues.join(',') + '\n';
    });

    // 创建下载链接
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `time9.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // debugger
}

const windaGeoJson = (geojson) => {
    mapR.addSource('window111', {
        type: 'geojson',
        data: geojson
    })

    mapR.addLayer({
        id: 'window111',
        source: 'window111',
        type: 'fill',
        paint: {
            'fill-color': '#c62457',
            'fill-outline-color': '#da97ac',
        },
    })
}

const windaGeoJsonOrg = () => {
    mapR.addSource('window0', {
        type: 'geojson',
        data: '/geojson/conc-time-linux.geojson'
    })

    mapR.addLayer({
        id: 'window0',
        source: 'window0',
        type: 'fill',
        paint: {
            'fill-color': '#ccc',
            'fill-outline-color': '#da97ac',
            'fill-opacity': 0.3
        },
        filter: ['==', ['get', 'Hour'], 1],
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
    background-color: aquamarine;
}
</style>