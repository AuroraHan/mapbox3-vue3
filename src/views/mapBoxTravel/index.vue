<template>
    <div id="map" class="map"></div>
    <div class="mycl" @click="getGoade">点击</div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useMapbox } from '/@/hooks/useMapBoxLine'
import coordtransform from 'coordtransform'

let mapR: mapboxgl.Map;
const { getMap } = useMapbox({ container: 'map', isOffline: false })
const GDToken = '13a8845c1b8ec06820d036288b78900e'

onMounted(() => {
    baseConfig()
})

const baseConfig = () => {
    mapR = getMap()!
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
}

.mycl {
    position: absolute;
    left: 3%;
    top: 4%;
    z-index: 9;
    background-color: aqua;
}
</style>