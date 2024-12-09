<template>
    <div id="map"></div>
</template>

<script setup>
import { onMounted } from 'vue'
import { Scene, Mapbox, PointLayer } from '@antv/l7'
import mapbox from 'mapbox-gl';
const token = "pk.eyJ1IjoiaHBqbmYiLCJhIjoiY20yMzU5OGhzMDI2NjJrb2kweG5yYWRuZSJ9.HX3dEC4HuYwKuA3_Fm2wXA"
onMounted(() => {
    mapbox.accessToken = "pk.eyJ1IjoiaHBqbmYiLCJhIjoiY20yMzU5OGhzMDI2NjJrb2kweG5yYWRuZSJ9.HX3dEC4HuYwKuA3_Fm2wXA";
    const map = new mapbox.Map({
        container: 'map',
        projection: "mercator",
        style: 'mapbox://styles/mapbox/outdoors-v12',
        center: [120, 30],
        zoom: 2,
    })

    const scene = new Scene({
        id: 'map',
        map: new Mapbox({
            mapInstance: map,
        }),
    });

    fetch('https://gw.alipayobjects.com/os/rmsportal/oVTMqfzuuRFKiDwhPSFL.json')
        .then((res) => res.json())
        .then((data) => {
            const pointLayer = new PointLayer({})
                .source(data.list, {
                    parser: {
                        type: 'json',
                        x: 'j',
                        y: 'w',
                    },
                })
                .shape('cylinder')
                .size('t', function (level) {
                    return [1, 2, level * 2 + 20];
                })
                .color('t', [
                    '#094D4A',
                    '#146968',
                    '#1D7F7E',
                    '#289899',
                    '#34B6B7',
                    '#4AC5AF',
                    '#5FD3A6',
                    '#7BE39E',
                    '#A1EDB8',
                    '#CEF8D6',
                ])
                .style({
                    opacity: 1.0,
                });
            scene.addLayer(pointLayer);
        });
})

</script>

<style scoped>
#map {
    height: 100vh;
}
</style>