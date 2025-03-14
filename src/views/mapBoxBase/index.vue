<template>
    <div class="top-controls">
        <div class="lonlat">
            经度:{{ Number(jw?.lng).toFixed(5) }} 纬度:{{ Number(jw?.lat).toFixed(5) }} 层级:{{ zoom.toFixed(1) }}
        </div>
    </div>
    <div id="map" class="map"></div>

    <!-- 下拉列表  -->
    <div class="oparate">
        <el-collapse accordion>
            <el-collapse-item title="工具集" name="1">
                <div class="tools">
                    <div class="item">
                        <div class="title">测量工具</div>
                        <el-switch v-model="controls.isDraw" />
                    </div>
                </div>
            </el-collapse-item>
        </el-collapse>
    </div>

    <el-drawer title="设备管理器" v-model="drawerValue" direction="ltr" :modal="false" size="20%">
        <EquipmentManage @selectBox="selectBox"></EquipmentManage>
    </el-drawer>
    <!-- 测量工具组件 -->
    <DrawTools v-if="controls.isDraw" :drawI="Draw" :mapI="mapR"></DrawTools>
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
import EquipmentManage from '../../components/equipmentManage/index.vue'
import DrawTools from './components/drawTools.vue';

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
    isDraw: false
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


//打开、关闭抽屉弹出框
const drawerValue = ref(false)
const onOpenDrawer = () => {
    drawerValue.value = !drawerValue.value
}

//选择设备
const selectBox = (item) => {
    //获取当前地图的中心点
    const { lng, lat } = mapR.getCenter();
    if (item.enable) {
        //添加图标
        const dom = createImg(item.svg);
        const result = new mapbox.Marker({
            element: dom,
            draggable: true
        }).setLngLat([lng, lat]).setPopup(new mapbox.Popup().setHTML(`<h2>${item.name}</h2>`)).addTo(mapR);
        //把实例添加到对象中
        item.intanst = result
    } else {
        //移除图标
        item.intanst.remove()
        item.intanst = null
    }
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
</script>

<style lang="scss" scoped>
@import './index.scss';
</style>
