<template>
    <div id="map"></div>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue'
import { Scene, Mapbox, PointLayer } from '@antv/l7'
import { useMapbox } from '../../hooks/useMapBox';

let mapBox: mapboxgl.Map | null = null;
let scene: Scene
const { getMap } = useMapbox({ container: 'map' })

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

    add()
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

</script>

<style scoped>
#map {
    height: 100vh;
}
</style>