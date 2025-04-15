<template>
    <div id="map" class="map"></div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, } from 'vue'
import mapbox, { Marker, PointLike } from 'mapbox-gl';
import { useMapbox } from '../../hooks/useMapBox'
import * as Turf from '@turf/turf'
import coordtransform from 'coordtransform'

let mapR: mapboxgl.Map;
let Draw: any;

const { getMap } = useMapbox({ container: 'map', isOffline: true })

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
        mapR.setCenter(allLonLat[0])
        mapR.setZoom(16)
        mapR.setPitch(45)
        pathLayer()
    })

}

//当前距离
const currentDistance = ref(0)
//所有经纬度点坐标
const allLonLat: [number, number][] = []
const currentSpeed = ref(120) // 初始速度到 20km/h

//调用高德接口
const getGoade = async () => {
    const res = await fetch('https://restapi.amap.com/v5/direction/driving?origin=114.40654,30.49940&destination=114.55808,30.49017&key=b1783f9c16e48520ac5cd31031904fa4&show_fields=polyline', {
        method: 'get'
    })

    const result = await res.json()
    pathPlanGaode(result.route.paths)

}

getGoade()

//-----高德路径规划---------
const pathPlanGaode = (paths: Array<any>) => {
    const path1 = paths[0]

    //获取路线经过的所有经纬度
    path1.steps.forEach((step: any) => {
        //未进行偏移处理
        // const lonlats = step.polyline.split(';').map(p => p.split(',').map(Number));

        //进行了偏移处理
        // 1. 按分号分割字符串得到各个坐标点
        const points = step.polyline.split(';');

        // 2. 对每个点进行处理，分割经度纬度并转换为数字
        const result = points.map(point => {
            const [lng, lat] = point.split(',');
            const wgs84Coord = coordtransform.gcj02towgs84(lng, lat);

            return [wgs84Coord[0], wgs84Coord[1]];
        });

        allLonLat.push(...result)
    });

}


// 创建路线的 LineString
const routeLine = computed(() => {
    return Turf.lineString(allLonLat)
})

// 计算路线总长度（米）
const totalDistance = computed(() => {
    return Turf.length(routeLine.value, { units: 'meters' })
})

// 计算剩余距离
const remainingDistance = computed(() => {
    return Math.round(totalDistance.value - currentDistance.value)
})


// 计算预计剩余时间（分钟）
const remainingTime = computed(() => {
    const speed = currentSpeed.value / 3.6 // 转换为米/秒
    return Math.max(1, Math.round((remainingDistance.value / speed) / 60))
})


//加载线路图层
const pathLayer = () => {
    // 添加路线图层
    mapR?.addSource('route', {
        type: 'geojson',
        data: routeLine.value
    })

    mapR?.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
            'line-join': 'round',
            'line-cap': 'round'
        },
        paint: {
            'line-color': '#00ff00',//绿色
            'line-width': 10,
            'line-opacity': 0.9
        }
    })

}


</script>

<style lang="scss" scoped>
@import './index.scss';
</style>
