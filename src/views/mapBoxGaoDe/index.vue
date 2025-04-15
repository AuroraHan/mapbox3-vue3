<template>
    <div id="map" class="map"></div>
    <div class="top">
        <div class="info-panel">
            <div class="info-item">
                <span class="label">剩余距离</span>
                <span class="value">{{ remainingDistance }}米</span>
            </div>
            <div class="info-item">
                <span class="label">预计时间</span>
                <span class="value">{{ remainingTime }}分钟</span>
            </div>
            <div class="info-item">
                <span class="label">当前速度</span>
                <span class="value">{{ currentSpeed }}km/h</span>
            </div>
        </div>
    </div>
    <div class="buttom">
        <el-button class="btn" :disabled="isNavigating" @click="startNavigation">开始导航</el-button>
        <el-button class="btn" :disabled="!isNavigating" @click="pauseNavigation">暂停导航</el-button>
        <el-button class="btn" @click="resetNavigation"> 重置</el-button>
    </div>

</template>

<script setup lang="ts">
import { onMounted, ref, computed, onUnmounted } from 'vue'
import { useMapbox } from '../../hooks/useMapBox'
import * as Turf from '@turf/turf'
import coordtransform from 'coordtransform'
import mapboxgl from 'mapbox-gl';
import arrow from '../../assets/nav2.png'

let mapR: mapboxgl.Map;
const marker = ref<mapboxgl.Marker | null>(null)

const { getMap } = useMapbox({ container: 'map', isOffline: false })

//当前经纬度
const jw = ref<{ lat: number, lng: number }>({ lat: 0, lng: 0 });

//当前缩放层级
const zoom = ref<Number>(0)

onMounted(() => {
    baseConfig()
})

onUnmounted(() => {
    if (animationFrameId.value) {
        cancelAnimationFrame(animationFrameId.value)
    }
})


//基础配置
const baseConfig = () => {
    mapR = getMap()!
    const scale = new mapboxgl.ScaleControl();
    mapR.addControl(new mapboxgl.NavigationControl());
    mapR.addControl(scale);

    mapR.on('load', () => {
        mapR.setCenter(allLonLat.value[0])
        mapR.setZoom(16)
        mapR.setPitch(45)
        pathLayer()

        // 添加导航标记（使用自定义箭头标记）
        const el = document.createElement('div')
        el.className = 'navigation-marker'
        el.innerHTML = `<img src="${arrow}" style="width: 64px; height: 64px;" alt="arrow" />`
        el.style.fontSize = '24px'

        marker.value = new mapboxgl.Marker({
            element: el,
            rotationAlignment: 'map'
        })
            .setLngLat(allLonLat.value[0])
            .addTo(mapR)

    })

}

//当前距离
const currentDistance = ref(0)
//所有经纬度点坐标
const allLonLat = ref<Array<[number, number]>>([])
const currentSpeed = ref(100) // 初始速度到
const isNavigating = ref(false)
const animationFrameId = ref<number | null>(null)
const lastTimestamp = ref<number>(0)

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

        allLonLat.value.push(...result)
    });

}


// 创建路线的 LineString
const routeLine = computed(() => {
    return Turf.lineString(allLonLat.value)
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

// 获取路线上的点位置
const getPositionAlongRoute = (distance: number): [number, number] => {
    try {
        if (distance <= 0) return allLonLat.value[0]
        if (distance >= totalDistance.value) return allLonLat.value[allLonLat.value.length - 1]

        const point = Turf.along(routeLine.value, distance / 1000, { units: 'kilometers' })
        return point.geometry.coordinates as [number, number]
    } catch (error) {
        console.error('Error calculating position:', error)
        return allLonLat.value[0]
    }
}

// 计算路线上某点的方向角度
const calculateBearing = (distance: number): number => {
    try {
        const currentPoint = getPositionAlongRoute(distance)
        const aheadPoint = getPositionAlongRoute(Math.min(distance + 5, totalDistance.value))
        return Turf.bearing(
            Turf.point(currentPoint),
            Turf.point(aheadPoint)
        )
    } catch (error) {
        console.error('Error calculating bearing:', error)
        return 0
    }
}

// 动画函数
const animate = (timestamp: number) => {
    if (!isNavigating.value) return

    if (!lastTimestamp.value) {
        lastTimestamp.value = timestamp
        animationFrameId.value = requestAnimationFrame(animate)
        return
    }

    const deltaTime = timestamp - lastTimestamp.value
    // const speed = currentSpeed.value / 3.6 // 转换为米/秒
    const speed = currentSpeed.value // 转换为米/秒
    const distanceDelta = (deltaTime / 1000) * speed

    const newDistance = currentDistance.value + distanceDelta
    if (newDistance >= totalDistance.value) {
        isNavigating.value = false
        currentDistance.value = totalDistance.value
        return
    }

    currentDistance.value = newDistance
    const position = getPositionAlongRoute(currentDistance.value)
    const bearing = calculateBearing(currentDistance.value)

    if (marker.value && position) {
        marker.value
            .setLngLat(position)
            .setRotation(bearing)

        // 更新地图视角，添加前瞻性视角
        const lookAheadDistance = Math.min(currentDistance.value + 30, totalDistance.value) // 前看30米
        const lookAheadPosition = getPositionAlongRoute(lookAheadDistance)

        mapR.easeTo({
            center: lookAheadPosition,
            bearing: bearing,
            duration: 50,
            pitch: 45
        })
    }

    lastTimestamp.value = timestamp
    animationFrameId.value = requestAnimationFrame(animate)
}


// 开始导航
const startNavigation = () => {
    if (isNavigating.value) return
    isNavigating.value = true
    lastTimestamp.value = 0
    animate(performance.now())
}

// 暂停导航
const pauseNavigation = () => {
    isNavigating.value = false
    if (animationFrameId.value) {
        cancelAnimationFrame(animationFrameId.value)
    }
}

// 重置导航
const resetNavigation = () => {
    isNavigating.value = false
    currentDistance.value = 0
    lastTimestamp.value = 0
    if (animationFrameId.value) {
        cancelAnimationFrame(animationFrameId.value)
    }
    if (marker.value) {
        marker.value
            .setLngLat(allLonLat.value[0])
            .setRotation(0)
    }
    mapR.easeTo({
        center: allLonLat.value[0],
        zoom: 16,
        pitch: 45,
        bearing: 0,
        duration: 1000
    })
}



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
