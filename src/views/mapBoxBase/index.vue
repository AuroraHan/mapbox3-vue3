<template>
    <div class="top-controls">
        <div class="lonlat">
            经度:{{ Number(jw?.lng).toFixed(5) }} 纬度:{{ Number(jw?.lat).toFixed(5) }} 层级:{{ zoom.toFixed(1) }}
        </div>
        <div class="operate">
            <div>工具集</div>
            <el-switch v-model="controls.isOprate" />
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
</template>

<script setup lang="ts">
import { onMounted, ref, createApp, reactive } from 'vue'
import mapbox, { Marker, PointLike } from 'mapbox-gl';
import GlobeMinimap from "mapbox-gl-globe-minimap";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import { AnimatedGIF, CanvasIcon } from '@sakitam-gis/viz-mapbox-gl';
import { useMapbox } from '../../hooks/useMapBox'
import Popup from './components/popup.vue';
import { createImg } from '../../utils/mapTools'
import DrawTools from './components/drawTools.vue';
import EquipmentManage from './components/equipmentManage.vue'

let mapR: mapboxgl.Map;
let Draw;

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
    isOprate: false
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
        // addPoint()
        point()
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

//
const addPoint = () => {
    mapR.addSource('test', {
        type: 'geojson',
        data: '/geojson/grid_points.geojson'
    })

    mapR.addLayer({
        id: 'test',
        source: 'test',
        type: 'circle',
        paint: {
            'circle-color': '#ff0000',
        },
    })
}

const point = () => {
    const geojson = {
        'type': 'FeatureCollection',
        'features': [] as any
    }
    const testPoint = [[108, 18], [109, 18], [110, 18], [108, 19], [109, 19], [110, 19], [111, 19], [109, 20], [110, 20], [121, 20], [122, 20], [99, 21], [100, 21], [101, 21], [106, 21], [107, 21], [108, 21], [109, 21], [110, 21], [111, 21], [112, 21], [113, 21], [114, 21], [120, 21], [121, 21], [99, 22], [100, 22], [101, 22], [102, 22], [103, 22], [104, 22], [105, 22], [106, 22], [107, 22], [108, 22], [109, 22], [110, 22], [111, 22], [112, 22], [113, 22], [114, 22], [115, 22], [116, 22], [120, 22], [121, 22], [97, 23], [98, 23], [99, 23], [100, 23], [101, 23], [102, 23], [103, 23], [104, 23], [105, 23], [106, 23], [107, 23], [108, 23], [109, 23], [110, 23], [111, 23], [112, 23], [113, 23], [114, 23], [115, 23], [116, 23], [117, 23], [118, 23], [119, 23], [120, 23], [121, 23], [97, 24], [98, 24], [99, 24], [100, 24], [101, 24], [102, 24], [103, 24], [104, 24], [105, 24], [106, 24], [107, 24], [108, 24], [109, 24], [110, 24], [111, 24], [112, 24], [113, 24], [114, 24], [115, 24], [116, 24], [117, 24], [118, 24], [119, 24], [120, 24], [121, 24], [122, 24], [123, 24], [124, 24], [125, 24], [97, 25], [98, 25], [99, 25], [100, 25], [101, 25], [102, 25], [103, 25], [104, 25], [105, 25], [106, 25], [107, 25], [108, 25], [109, 25], [110, 25], [111, 25], [112, 25], [113, 25], [114, 25], [115, 25], [116, 25], [117, 25], [118, 25], [119, 25], [121, 25], [122, 25], [123, 25], [124, 25], [92, 26], [93, 26], [98, 26], [99, 26], [100, 26], [101, 26], [102, 26], [103, 26], [104, 26], [105, 26], [106, 26], [107, 26], [108, 26], [109, 26], [110, 26], [111, 26], [112, 26], [113, 26], [114, 26], [115, 26], [116, 26], [117, 26], [118, 26], [119, 26], [120, 26], [85, 27], [86, 27], [87, 27], [88, 27], [89, 27], [90, 27], [91, 27], [92, 27], [93, 27], [94, 27], [95, 27], [96, 27], [97, 27], [98, 27], [99, 27], [100, 27], [101, 27], [102, 27], [103, 27], [104, 27], [105, 27], [106, 27], [107, 27], [108, 27], [109, 27], [110, 27], [111, 27], [112, 27], [113, 27]]
    for (const ele of testPoint) {
        geojson.features.push({
            'type': 'Feature',
            'properties': {

            },
            'geometry': {
                'type': 'Point',
                'coordinates': ele
            }
        })
    }

    mapR.addSource('test', {
        type: 'geojson',
        data: geojson
    })

    mapR.addLayer({
        id: 'test',
        source: 'test',
        type: 'circle',
        paint: {
            'circle-color': '#ff0000',
        },
    })
}
</script>

<style lang="scss" scoped>
@import './index.scss';
</style>
