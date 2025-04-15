<template>
    <div id="map" class="map"></div>
</template>

<script setup lang="ts">
import { onMounted, ref, createApp, reactive } from 'vue'
import mapbox, { Marker, PointLike } from 'mapbox-gl';
import { useMapbox } from '../../hooks/useMapBox'

let mapR: mapboxgl.Map;
let Draw: any;

const { getMap } = useMapbox({ container: 'map', isOffline: false })

//当前经纬度
const jw = ref<{ lat: number, lng: number }>({ lat: 0, lng: 0 });

//当前缩放层级
const zoom = ref<Number>(0)

onMounted(() => {
    baseConfig()
})


//基础配置
const baseConfig = () => {
    mapR = getMap()!
    const scale = new mapbox.ScaleControl();
    mapR.addControl(scale);

    mapR.on('load', () => {

    })

}


//-----高德路径规划---------
const pathPlanGaode = () => {

}

</script>

<style lang="scss" scoped>
@import './index.scss';
</style>
