<template>
    <div id="map" class="map"></div>
    <div class="top">
        <div class="info-panel" v-if="allLonLat.length">
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

    <!-- 左侧线路 -->
    <div class="left" @click="loadTraffic">
        <div class="path" v-for="(item, index) in pathArr" :key="index" @click="onclickPath(item)">
            <div class="name">{{ item.name }}</div>
            <div class="dis">{{ item.distance / 1000 }} KM</div>
        </div>
    </div>

    <!-- 右侧进度条 -->
    <div class="right" v-if="allLonLat.length">
        <el-slider v-model="prag" :max="totalDistance" vertical height="400px" disabled :show-tooltip="false" />
    </div>

</template>

<script setup lang="ts">
import { onMounted, ref, computed, onUnmounted } from 'vue'
import { useMapbox } from '../../hooks/useMapBox'
import * as Turf from '@turf/turf'
import coordtransform from 'coordtransform'
import mapboxgl from 'mapbox-gl';
import arrow from '../../assets/nav2.png'
import { removeLayerAndSource } from '@/utils/mapTools';

let mapR: mapboxgl.Map;
const marker = ref<mapboxgl.Marker | null>(null)
let popup: mapboxgl.Popup;

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

        //弹出框实例
        popup = new mapboxgl.Popup({
            closeButton: false,
        });

        // 添加导航标记（使用自定义箭头标记）
        const el = document.createElement('div')
        el.className = 'navigation-marker'
        el.innerHTML = `<img src="${arrow}" style="width: 64px; height: 64px;" alt="arrow" />`
        el.style.fontSize = '24px'
        marker.value = new mapboxgl.Marker({
            element: el,
            rotationAlignment: 'map'
        })
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

const pathArr = ref<Array<any>>() //线路集合数组

//调用路径规划高德接口
const getGoade = async () => {
    const res = await fetch('https://restapi.amap.com/v5/direction/driving?origin=114.40654,30.49940&destination=114.55808,30.49017&key=b1783f9c16e48520ac5cd31031904fa4&show_fields=polyline', {
        method: 'get'
    })

    const result = await res.json()
    if (!result.status) {
        window.alert('服务器错误')
        return
    }
    handlerPaths(result.route.paths)
}

getGoade()

//对于返回线路数组的处理
const handlerPaths = (paths: Array<any>) => {
    pathArr.value = paths.map((ele, index) => {
        return {
            name: `线路${index + 1}`,
            distance: ele.distance,
            steps: ele.steps
        }
    })
}

//-----高德路径规划---------
const pathPlanGaode = (paths: any) => {
    allLonLat.value = []

    //获取路线经过的所有经纬度
    paths.steps.forEach((step: any) => {
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

    mapR.setCenter(allLonLat.value[0])
    mapR.setZoom(16)
    mapR.setPitch(45)
    pathLayer()

    marker.value?.setLngLat(allLonLat.value[0])
        .addTo(mapR)
}

//点击其中一条线路
const onclickPath = (item: any) => {
    pathPlanGaode(item)
    resetNavigation()
}


const prag = computed(() => {
    return totalDistance.value - remainingDistance.value
})


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
    mapR.setZoom(16)
    mapR.setPitch(45)
    animate(performance.now())
}

// 暂停导航
const pauseNavigation = () => {
    isNavigating.value = false
    mapR.setZoom(16)
    mapR.setPitch(45)
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
    removeLayerAndSource(mapR, 'route', 1)
    removeLayerAndSource(mapR, 'route', 0)

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

//--------------------交通态势----------------------------
const trafficApi = async () => {
    const res = await fetch('https://restapi.amap.com/v3/traffic/status/circle?location=114.39364,30.50839&radius=4000&level=5&extensions=all&key=b1783f9c16e48520ac5cd31031904fa4', {
        method: 'get'
    }).then((res) => {
        return res.json()
    })

    if (!res.status) {
        window.alert('服务器错误')
        return
    }

    handlerResult(res.trafficinfo.roads)

}

trafficApi()

const transformGaoDeToWGS84 = (paths: string) => {

    //进行了偏移处理
    // 1. 按分号分割字符串得到各个坐标点
    const points = paths.split(';');

    // 2. 对每个点进行处理，分割经度纬度并转换为数字
    const result = points.map(point => {
        const [lng, lat] = point.split(',');
        const wgs84Coord = coordtransform.gcj02towgs84(lng, lat);

        return [wgs84Coord[0], wgs84Coord[1]];
    });

    return [...result];
}

//交通态势路线geojson
const pathGeoJSon = {
    type: "FeatureCollection",
    features: []
} as GeoJSON.FeatureCollection<GeoJSON.LineString>

const handlerResult = (roads: Array<any>) => {

    //获取路线经过的所有经纬度
    roads.forEach((step: any) => {
        // 2. 对每个点进行处理，分割经度纬度并转换为数字
        const result = transformGaoDeToWGS84(step.polyline)
        pathGeoJSon.features.push({
            type: "Feature",
            properties: {
                name: step.name,
                status: step.status,
                direction: step.direction,
                angle: step.angle,
                lcodes: step.lcodes,
                speed: step.speed
            },
            geometry: {
                type: 'LineString',
                coordinates: result
            }
        })
    });
}

//加载交通态势路线
const loadTraffic = () => {
    let hoveredPolygonId: any;
    mapR.addSource('traffic', {
        type: 'geojson',
        data: pathGeoJSon,
        generateId: true
    })

    mapR.addLayer({
        id: 'traffic',
        type: 'line',
        source: 'traffic',
        paint: {
            'line-color': [
                'match',
                ['get', 'status'],
                '1', '#36a936',
                '2', '#ffff00',
                '3', '#ff0000',
                '#545758'
            ],
            'line-width': 7,
            'line-opacity': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                1,
                0.5
            ]
        },
        layout: {
            'line-join': 'round',
            'line-cap': 'round'
        }
    })

    mapR?.on('mousemove', 'traffic', (e) => {
        if (e.features!.length > 0) {
            mapR.getCanvas().style.cursor = 'pointer';
            if (hoveredPolygonId !== null) {
                mapR?.setFeatureState(
                    { source: 'traffic', id: hoveredPolygonId },
                    { hover: false }
                );
            }
            hoveredPolygonId = e.features![0].id;
            //加载弹出框
            popup.setLngLat([e.lngLat.lng, e.lngLat.lat]).setHTML(`
                道路名称:${e.features![0].properties?.name}</br>
                平均速度:${e.features![0].properties?.speed}km/h </br>
                方向描述:${e.features![0].properties?.direction}
            `).addTo(mapR!)
            mapR?.setFeatureState(
                { source: 'traffic', id: hoveredPolygonId },
                { hover: true }
            );
        }
    });


    mapR?.on('mouseleave', 'traffic', () => {
        mapR.getCanvas().style.cursor = '';
        if (hoveredPolygonId !== null) {
            mapR?.setFeatureState(
                { source: 'traffic', id: hoveredPolygonId },
                { hover: false }
            );
        }
        hoveredPolygonId = null;
        popup.remove()
    });
}
</script>

<style lang="scss" scoped>
@import './index.scss';
</style>
