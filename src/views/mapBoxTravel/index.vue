<template>
    <div id="map" class="map"></div>
    <div class="mycl" @click="getGoade">点击</div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useMapbox } from '/@/hooks/useMapBoxLine'
import coordtransform from 'coordtransform'
import { markerGeojson } from './mock'
import mapboxgl from 'mapbox-gl';

let mapR: mapboxgl.Map;
const { getMap } = useMapbox({ container: 'map', isOffline: false })
const GDToken = '13a8845c1b8ec06820d036288b78900e'

onMounted(() => {
    baseConfig()
})



const baseConfig = () => {
    mapR = getMap()!

    mapR.on('load', () => {
        addMarker()
    })
}


const addMarker = () => {
    for (const marker of markerGeojson.features) {
        // Create a DOM element for each marker.
        const el = document.createElement('div');
        const width = marker.properties.iconSize[0];
        const height = marker.properties.iconSize[1];
        el.id = 'my_marker';
        el.style.backgroundImage = `url(https://picsum.photos/id/${marker.properties.imageId}/${width}/${height})`;
        el.style.width = `${width}px`;
        el.style.height = `${height}px`;
        el.style.backgroundSize = '100%';

        const popup = new mapboxgl.Popup({ offset: 25, closeButton: false })
            .setText(`${marker.properties.message}`)

        // Add markers to the map.
        new mapboxgl.Marker(el)
            .setLngLat(marker.geometry.coordinates)
            .setPopup(popup)
            .addTo(mapR);
    }
}

//地理/逆地理编码
const getGoade = async () => {
    const res = await fetch(`https://restapi.amap.com/v3/geocode/geo?address=北京市朝阳区&key=${GDToken}`, {
        method: 'get'
    })

    const result = await res.json()
    if (!result.status) {
        window.alert('服务器错误')
        return
    }

    const [lng, lat] = result.geocodes[0].location.split(',')


    const wgs84Coord = coordtransform.gcj02towgs84(lng, lat);
    console.log(wgs84Coord);

}


</script>

<style lang="scss" scoped>
.map {
    height: 100vh;

    :deep(#my_marker) {
        display: block;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        padding: 0;
    }
}



.mycl {
    position: absolute;
    left: 3%;
    top: 4%;
    z-index: 9;
    background-color: aqua;
}
</style>