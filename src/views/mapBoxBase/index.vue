<template>
    <div class="top-controls">
        <div class="menu">
            <div class="lonlat">
                经度:{{ Number(jw?.lng).toFixed(5) }} 纬度:{{ Number(jw?.lat).toFixed(5) }} 层级:{{ zoom.toFixed(1) }}
            </div>

            <div class="operate">
                <div>工具集</div>
                <el-switch v-model="controls.isOprate" />
            </div>

            <div class="operate">
                <div>天气系统</div>
                <el-switch v-model="controls.isWeather" />
            </div>
        </div>
        <div class="menu">
            <div class="cut-img"><el-button type="success" size="small" @click="canvasToImage">截图</el-button></div>
            <el-button @click="projection" size="small" type="primary">视图</el-button>
        </div>
    </div>
    <div id="map" class="map"></div>

    <!-- 下拉列表  -->
    <div v-if="controls.isOprate" class="oparate">
        <el-collapse accordion>
            <el-collapse-item title="工具集" name="1">
                <div class="tools">
                    <div class="item">
                        <div class="title">测量工具</div>
                        <el-switch v-model="controls.isDraw" />
                    </div>
                    <div class="item">
                        <div class="title">标绘</div>
                        <el-switch v-model="controls.isEquipment" />
                    </div>
                </div>
            </el-collapse-item>
        </el-collapse>
    </div>

    <!-- 测量工具组件 -->
    <DrawTools v-if="controls.isDraw" :drawI="Draw" :mapI="mapR"></DrawTools>

    <!-- 装备类 -->
    <EquipmentManage v-if="controls.isEquipment" :mapI="mapR"></EquipmentManage>

    <!-- 天气系统 -->
    <Weather v-model="controls.isWeather" :mapI="mapR"></Weather>
</template>

<script setup lang="ts">
import { onMounted, ref, createApp, reactive } from 'vue'
import mapbox, { Marker, PointLike } from 'mapbox-gl';
import GlobeMinimap from "mapbox-gl-globe-minimap";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import { AnimatedGIF, CanvasIcon } from '@sakitam-gis/viz-mapbox-gl';
import { useMapbox } from '../../hooks/useMapBox'
import Popup from './components/popup.vue';
import { createImg, flyTo } from '../../utils/mapTools'
import DrawTools from './components/drawTools.vue';
import EquipmentManage from './components/equipmentManage.vue'
import Weather from './components/weather.vue'

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

//弹出框实例
const popup = new mapbox.Popup({
    closeButton: false,
});


//控制工具类
const controls = reactive({
    isDraw: false,
    isEquipment: false,
    isOprate: false,
    isWeather: false
})

//基础配置
const baseConfig = () => {
    mapR = getMap()!

    //加载地球仪组件
    mapR?.addControl(
        //@ts-ignore
        new GlobeMinimap({
            globeSize: 150,
            landColor: "#4ebf6e",
            waterColor: "#8dcbe3"
        }),
        "bottom-right"
    );

    const scale = new mapbox.ScaleControl();
    mapR.addControl(scale);

    //加载绘制组件
    Draw = new MapboxDraw({
        controls: {
            'combine_features': false,
            'uncombine_features': false,
        }
    });
    mapR.addControl(Draw, 'top-right');
    // 将元素隐藏起来
    const dom = document.getElementsByClassName('mapbox-gl-draw_ctrl-draw-btn')
    for (let i = 0; i < dom.length; i++) {
        //@ts-ignore
        dom[i].style.display = 'none';
    }


    mapR.on('load', () => {
        // addPoint()//多个点
        // stainRain()
        // fillImage()
        addPoint()
    })

    mapR.on('mousemove', (e: { lngLat: { lat: number, lng: number } }) => {
        jw.value = e.lngLat;
    })

    mapR.on('click', ['wrjpoint'], (e) => {
        const bbox = [
            [e.point.x - 5, e.point.y - 5],
            [e.point.x + 5, e.point.y + 5]
        ] as [PointLike, PointLike];
        //自定义点击图层
        const hdFeatures = mapR!.queryRenderedFeatures(bbox)
        console.log(hdFeatures);
    })

    mapR.on('zoom', () => {
        zoom.value = mapR.getZoom() as Number;
    })

    mapR.on('moveend', () => {
    })
}

//试图切换
const projection = () => {
    const projection = mapR.getProjection();

    if (projection.name == 'globe') {
        mapR.setProjection('mercator')
    }

    if (projection.name == 'mercator') {
        mapR.setProjection('globe')
    }
}

//生成截图
const canvasToImage = () => {
    // 获取地图 Canvas 元素
    const canvas = mapR.getCanvas();

    // 将 Canvas 转换为 Base64 格式的 PNG 图片
    const dataURL = canvas.toDataURL('image/png');

    // 创建下载链接
    const link = document.createElement('a');
    link.download = 'map-snapshot.png';
    link.href = dataURL;
    link.click();
}


//添加自定义弹出框
const getSiteInfo = (data: any) => {
    if (data?.properties) {
        const container = document.createElement('div')
        //@ts-ignore
        createApp(Popup, { objInfo: data.properties }).mount(container)
        //@ts-ignore
        popup.setLngLat(data.geometry.coordinates).setDOMContent(container).addTo(mapR!)
    }
}

//添加三维模型
const addPoint = () => {
    flyTo(mapR, [120, 30], 13)
    mapR.addSource('test', {
        type: 'geojson',
        data: {
            'type': 'Feature',
            'properties': {
                'model-uri': 'http://localhost:4000/models/CesiumDrone.glb'
            },
            'geometry': {
                'coordinates': [120, 30],
                'type': 'Point'
            }
        }
    })

    mapR.addLayer({
        'id': 'tower',
        'type': 'model',
        'source': 'test',
        'layout': {
            'model-id': 'http://localhost:4000/models/CesiumDrone.glb'
            // 'model-id': 'https://docs.mapbox.com/mapbox-gl-js/assets/tower.glb'
        },
        'paint': {
            'model-opacity': 1,
            // 'model-rotation': [0.0, 0.0, 35.0],
            'model-scale': [100, 100, 100],
            // 'model-color-mix-intensity': 0,
            // 'model-cast-shadows': true,
            // 'model-emissive-strength': 0.8
        }
    });
}



</script>

<style lang="scss" scoped>
@import './index.scss';
</style>
