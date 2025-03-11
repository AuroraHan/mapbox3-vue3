<template>
    <div id="map"></div>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue'
import { Scene, Mapbox, PointLayer, GeometryLayer } from '@antv/l7'
import { useMapbox } from '../../hooks/useMapBox';

let mapBox: mapboxgl.Map | null = null;
let scene: Scene
const { getMap } = useMapbox({ container: 'map', isOffline: true })

onMounted(() => {
    baseConfig()
})

const baseConfig = () => {
    const mapR = getMap()
    scene = new Scene({
        id: 'map',
        map: new Mapbox({
            mapInstance: mapR!,
        }),
    });
    //将mapbox提取出来
    mapBox = scene.map as mapboxgl.Map

    scene.on('loaded', () => {
        // addDem()
    })

    // add()
    // addImage()
}

const add = () => {
    const pointLayer = new PointLayer({})
    // mapBox?.on('load', () => {
    pointLayer.source({
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "name": "tom"
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [120, 30]
                }
            },
            {
                "type": "Feature",
                "properties": {
                    "name": "tom"
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [125, 30]
                }
            }
        ]
    }).shape('circle')
        .active(true)
        .animate(true)
        .size(50)
        .color('#ff0000')
    scene.addLayer(pointLayer);
    // })
}

const addImage = () => {
    scene.addImage('img1', '/images/test.webp')
    const img = new PointLayer().source({
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "name": "tom"
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [114, 30]
                }
            },
        ]
    }).shape('img1').size(40)

    scene.addLayer(img)
}

const addDem = () => {
    const layer = new GeometryLayer().shape('plane').style({
        // width: 0.074,
        // height: 0.061,
        // center: [120.1025, 30.2594],
        widthSegments: 100,
        heightSegments: 100,
        terrainClipHeight: 1,
        mapTexture:
            '/tile/{z}/{x}/{y}.jpg',
        terrainTexture:
            '/dem/{z}/{x}/{y}.png',
        rgb2height: (r, g, b) => {
            let h = (r * 255.0 * 256.0 * 256.0 + g * 255.0 * 256.0 + b * 255.0) * 0.1;
            h = h / 200 - 12750;
            h = Math.max(0, h);
            return h;
        },
    });
    scene.addLayer(layer);
}

</script>

<style scoped>
#map {
    height: 100vh;
}
</style>