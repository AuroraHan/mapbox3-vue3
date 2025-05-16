<template>
    <el-dialog :top="'5vh'" :width="boxSize.width" append-to-body v-model="show" draggablec @open="onOpenDialog"
        @close="onCloseDialog">
        <!-- {{ clock.currentTime }}--{{ clock.multiplier }} -->
        <div :id="mapId" :style="{ height: boxSize.height }"></div>
        <div class="my-con">
            <div class="left">
                <div class="time"> {{ computedTime }}</div>
                <div class="bottom">
                    <div class="oper" @click="onStart">开</div>
                    <div class="oper" @click="onStop">停</div>
                    <!-- <div class="oper">倍速</div> -->
                    <el-select v-model="clock.multiplier" style="width: 90px;" placeholder="倍速">
                        <el-option label="0.1倍" :value="0.1" />
                        <el-option label="0.5倍" :value="0.5" />
                        <el-option label="1倍" :value="1" />
                        <el-option label="2倍" :value="2" />
                        <el-option label="3倍" :value="3" />
                    </el-select>
                </div>
            </div>
            <div class="right">
                <div id="my-time"></div>
            </div>
        </div>
    </el-dialog>
</template>

<script lang='ts' setup>
import { ref, onActivated, reactive, PropType, toRefs, computed, watch } from 'vue';
import * as Cesium from "cesium";
import Timeline from './Timeline';
import * as Turf from '@turf/turf'
import mapboxgl, { StyleSpecification } from "mapbox-gl";

const props = defineProps({
    //唯一值
    mapId: {
        type: String,
        required: true
    },
    //控制显示和隐藏
    show: {
        type: Boolean,
        default: false
    },
    //弹出框里面地图的大小
    boxSize: {
        type: Object as PropType<{ width: String, height: String }>,
        default: {
            width: '83%',
            height: '600px'
        }
    }
})

const { show, boxSize, mapId } = toRefs(props)
let mapR: mapboxgl.Map | null;
let timeline: any

onActivated(() => {
    mapR?.resize()
})

// 定义时间
let clock = reactive(new Cesium.Clock({
    startTime: Cesium.JulianDate.fromIso8601("2025-04-28T10:37:10Z"),// 加Z处理时区问题
    currentTime: Cesium.JulianDate.fromIso8601("2025-04-28T10:37:10Z"),
    stopTime: Cesium.JulianDate.fromIso8601("2025-04-28T10:38:50Z"),
    clockRange: Cesium.ClockRange.LOOP_STOP,
    // clockStep: Cesium.ClockStep.SYSTEM_CLOCK_MULTIPLIER,
    clockStep: Cesium.ClockStep.TICK_DEPENDENT,
    multiplier: 1,//倍速
    shouldAnimate: true
}));

//格式化时间
const computedTime = computed(() => {
    const isoTime = Cesium.JulianDate.toIso8601(clock.currentTime, 0)
    return isoTime
})

watch(() => clock.currentTime, () => {
    mapR?.setFilter(layerId, ['==', ['get', 'time'], computedTime.value])
})

//初始化时间轴
const initTimeAxis = () => {
    timeline = new Timeline("my-time", clock);
    timeline.addEventListener("settime", handleSetTime, false);
}
const handleSetTime = (e: any) => {
    // console.log(e, 'kkkk');
    const scrubJulian = e.timeJulian;
    clock.currentTime = scrubJulian;

}

//点击开始
const onStart = () => {
    clock.shouldAnimate = true
    //设置倍速
    // clock.multiplier = 0.5
    function tick() {
        clock.tick();
        requestAnimationFrame(tick);
        // mapR?.setFilter(layerId, ['==', ['get', 'time'], computedTime.value])
        // clock.currentTime = Cesium.JulianDate.toIso8601(clock.currentTime);
        // console.log(Cesium.JulianDate.toIso8601(clock.currentTime));

    }
    requestAnimationFrame(tick);
}

const onStop = () => {
    clock.shouldAnimate = false
    clock.multiplier = 1
}

//------
//线性插值计算方法
const calute = async () => {
    const originalData = await fetch('/geojson/flypath.geojson')
        .then(response => response.json())

    // 结果数组
    const interpolatedFeatures = [];

    // 对每对连续点进行插值
    for (let i = 0; i < originalData.features.length - 1; i++) {
        const currentPoint = originalData.features[i];
        const nextPoint = originalData.features[i + 1];

        // 将时间转换为Date对象
        const currentTime = new Date(currentPoint.properties.time);
        const nextTime = new Date(nextPoint.properties.time);

        // 计算时间差（毫秒）
        const timeDiff = nextTime - currentTime;

        // 计算总秒数
        const totalSeconds = timeDiff / 1000;

        // 创建线串用于插值
        const line = Turf.lineString([
            currentPoint.geometry.coordinates,
            nextPoint.geometry.coordinates
        ]);

        // 添加当前点（除非是第一个点且已经添加过）
        if (i === 0) {
            interpolatedFeatures.push(currentPoint);
        }

        // 每秒插值一个点（跳过0秒和最后一秒）
        for (let j = 1; j < totalSeconds; j++) {
            // 计算插值比例 (0到1之间)
            const fraction = j / totalSeconds;

            // 沿线插值位置
            const interpolatedCoord = Turf.along(line, Turf.length(line) * fraction).geometry.coordinates;

            // 计算插值时间
            const interpolatedTime = new Date(currentTime.getTime() + j * 1000);
            const isoString = interpolatedTime.toISOString();
            const formattedTime = isoString.split('.')[0] + 'Z'; // 去除毫秒部分

            // 创建新的特征点
            const interpolatedPoint = {
                "type": "Feature",
                "properties": {
                    "id": `interp_${i}_${j}`,
                    "Conc": currentPoint.properties.Conc, // 保持浓度不变
                    "time": formattedTime
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": interpolatedCoord
                }
            };

            interpolatedFeatures.push(interpolatedPoint);
        }

        // 添加下一个点（最后一个点会在最后一次循环时添加）
        interpolatedFeatures.push(nextPoint);
    }
    return interpolatedFeatures
}

//加载路线配置
const layerId = 'fly-path'
const addFlyPath = async () => {

    //通过线性插值获取位置
    const features = await calute()

    mapR?.addSource('point', {
        type: 'geojson',
        data: {
            type: 'FeatureCollection',
            features: features
        }
    })

    mapR?.addSource(layerId, {
        type: 'geojson',
        data: '/geojson/time.geojson'
    })

    // mapR?.addLayer({
    //     id: layerId,
    //     source: layerId,
    //     type: 'circle',
    //     paint: {
    //         'circle-color': '#ff0000',
    //         'circle-radius': 6
    //     },
    //     filter: ['all', ['==', ['get', 'time'], computedTime.value]]
    // })

    mapR?.addLayer({
        id: layerId,
        type: 'symbol',
        source: 'point',
        layout: {
            'icon-image': 'aircraft',
            'icon-size': 1.3,
            'icon-allow-overlap': true // 允许图标重叠
        },
        paint: {
            'icon-opacity': 1 // 图标透明度
        },
        filter: ['all', ['==', ['get', 'time'], computedTime.value]]
    });

    mapR?.addLayer({
        id: 'line-' + layerId,
        type: 'line',
        source: layerId,
        filter: ['all', ['==', '$type', 'LineString']],
        layout: {
            'line-cap': 'round',
            'line-join': 'round'
        },
        paint: {
            'line-color': '#ff0000',
            'line-width': 3
        }
    })
}

//基础配置
const initMap = () => {
    const style = {
        version: 8,
        sources: {
            m_mono: {
                type: "raster",
                tiles: ["/tile/{z}/{x}/{y}.jpg"],
                tileSize: 256,
                attribution: "",
            },
        },
        glyphs: "../../static/glyphs/{fontstack}/{range}.pbf",
        sprite: "http://localhost:4000/static/mysprite/sprite",
        layers: [
            {
                id: "m_mono",
                type: "raster",
                source: "m_mono",
                minzoom: 0,
                maxzoom: 18,
            },
        ],
    } as StyleSpecification
    mapboxgl.accessToken =
        "J1IjoidTEwaW50IiwiYSI6InQtMnZvTkEifQ.c8mhXquPE7_xoB3P4Ag8cA";
    const map = new mapboxgl.Map({
        container: mapId.value,
        projection: "mercator",
        style: style,
        center: [120, 30],
        zoom: 2,
    });


    mapR = map;
    mapR.removeControl(mapR._logoControl);


    map.on('load', () => {
        addFlyPath()
    })
};

//打开弹出框的回调
const onOpenDialog = () => {
    initMap()
    initTimeAxis()
}

//移除方法
const removeMap = () => {
    mapR?.remove()
    mapR = null;
    timeline.destroy()
}
//关闭弹出框的回调
const onCloseDialog = () => {
    removeMap()
}

</script>
<style lang='scss' scoped>
.my-con {
    display: flex;
    justify-content: center;
    width: 100%;
    // height: 70px;
}

.left {
    width: 10%;

    // .time {
    //     height: 40px;
    // }
}

.bottom {
    display: flex;
    justify-content: space-between;

    :deep(.el-select__wrapper) {
        min-height: 25px !important;
    }
}

.oper {
    margin-right: 5px;
    font-size: 17px;
    font-weight: bold;
    cursor: pointer;
}

.right {
    width: 90%;
}

h1 {
    text-align: center;
}

.cesium-timeline-main {
    position: relative;
    left: 0;
    bottom: 0;
    overflow: hidden;
    border: solid 1px #888;
    -moz-user-select: none;
    -webkit-user-select: none;
    -ms-user-select: none;
    user-select: none;
}

.cesium-timeline-trackContainer {
    width: 100%;
    overflow: auto;
    border-top: solid 1px #888;
    position: relative;
    top: 0;
    left: 0;
}

.cesium-timeline-tracks {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
}

.cesium-timeline-needle {
    position: absolute;
    left: 0;
    top: 1.7em;
    bottom: 0;
    width: 1px;
    background: #f00;
}

.cesium-timeline-bar {
    position: relative;
    left: 0;
    top: 0;
    overflow: hidden;
    cursor: pointer;
    width: 100%;
    height: 1.7em;
    background: linear-gradient(to bottom,
            rgba(116, 117, 119, 0.8) 0%,
            rgba(58, 68, 82, 0.8) 11%,
            rgba(46, 50, 56, 0.8) 46%,
            rgba(53, 53, 53, 0.8) 81%,
            rgba(53, 53, 53, 0.8) 100%);
}

.cesium-timeline-ruler {
    /* NOTE: The label and the ruler must use the same font/size */
    visibility: hidden;
    white-space: nowrap;
    font-size: 80%;
    z-index: -200;
}

.cesium-timeline-highlight {
    position: absolute;
    bottom: 0;
    left: 0;
    background: #08f;
}

.cesium-timeline-ticLabel {
    position: absolute;
    top: 0;
    left: 0;
    white-space: nowrap;
    font-size: 80%;
    color: #eee;
}

.cesium-timeline-ticMain {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 1px;
    height: 50%;
    background: #eee;
}

.cesium-timeline-ticSub {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 1px;
    height: 33%;
    background: #aaa;
}

.cesium-timeline-ticTiny {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 1px;
    height: 25%;
    background: #888;
}

.cesium-timeline-icon16 {
    display: block;
    position: absolute;
    width: 16px;
    height: 16px;
    background-image: url("../../assets/nav2.png");
    background-repeat: no-repeat;
}
</style>
