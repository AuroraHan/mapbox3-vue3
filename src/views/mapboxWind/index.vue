<template>
    <div id="map"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useMapbox } from '../../hooks/useMapBox'
import { Layer, TileSource, RenderType, DecodeType, RenderFrom, MaskType, configDeps } from '@sakitam-gis/mapbox-wind';

let mapR: mapboxgl.Map | null = null;
const { getMap } = useMapbox({ container: 'map' })

onMounted(() => {
    mapR = getMap()
    mapR?.on('load', () => {
        configDeps(['https://unpkg.com/geotiff/dist-browser/geotiff.js']);
        addWind()
    })
})

onUnmounted(() => {
    mapR?.remove()
    mapR = null;
})

const addWind = async () => {

    //添加需要加载的范围
    const clip = await fetch('/geojson/china.geojson').then(res => res.json());
    //geoserverApi/geoserver/gwc/service/tms/1.0.0/gxh%3Awind-mercator@EPSG%3A900913@jpeg/{z}/{x}/{y}.jpeg
    const source = new TileSource('wind', {
        url: '/2023111703/{z}/{x}/{y}/wind-surface.jpeg',
        tileSize: 256,
        minZoom: 0,
        maxZoom: 3,
        roundZoom: true,
        decodeType: DecodeType.imageWithExif,
        wrapX: true,
    });

    const layer = new Layer('wind', source, {
        styleSpec: {
            'fill-color': ['interpolate', ['linear'], ['get', 'value'],
                0,
                'rgba(98,113,183,255)',
                1,
                'rgba(57,97,159,255)',
                3,
                'rgba(74,148,169,255)',
                5,
                'rgba(77,141,123,255)',
                7,
                'rgba(83,165,83,255)',
                9,
                'rgba(53,159,53,255)',
                11,
                'rgba(167,157,81,255)',
                13,
                'rgba(159,127,58,255)',
                15,
                'rgba(161,108,92,255)',
                17,
                'rgba(129,58,78,255)',
                19,
                'rgba(175,80,136,255)',
                21,
                'rgba(117,74,147,255)',
                24,
                'rgba(109,97,163,255)',
                27,
                'rgba(68,105,141,255)',
                29,
                'rgba(92,144,152,255)',
                36,
                'rgba(125,68,165,255)',
                46,
                'rgba(231,215,215,256)',
                51,
                'rgba(219,212,135,256)',
                77,
                'rgba(205,202,112,256)',
                104,
                'rgba(128,128,128,255)'
            ],
            opacity: 0.7,
        },
        renderFrom: RenderFrom.rg,
        displayRange: [0, 104],
        renderType: RenderType.particles,
        widthSegments: 1,
        heightSegments: 1,
        picking: true,
        mask: { //设置要查看的范围之内
            data: clip,
            // type: MaskType.outside,
            type: MaskType.inside, // 默认是 inside，即只显示范围内的
        }
    });

    mapR?.addLayer(layer);

    mapR?.on('click', e => {
        layer.picker(e.lngLat).then((v) => {
            console.log(v)
        })
    });
}

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