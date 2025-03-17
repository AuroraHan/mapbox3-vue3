<!--  -->
<template>
    <el-dialog :width="boxSize.width" append-to-body v-model="show" title="查看" @open="onOpenDialog"
        @close="onCloseDialog" draggable>
        <div :id="mapId" :style="{ height: boxSize.height }"></div>
    </el-dialog>
</template>

<script setup lang='ts'>
import { onActivated, toRefs, ref, PropType } from 'vue'
import mapboxgl, { StyleSpecification } from "mapbox-gl";

const props = defineProps({
    mapId: {
        type: String,
        required: true
    },
    show: {
        type: Boolean,
        default: false
    },
    boxSize: {
        type: Object as PropType<{ width: String, height: String }>,
        default: {
            width: '80%',
            height: '680px'
        }
    }
})

const emits = defineEmits(['exportMap'])

const { show, boxSize, mapId } = toRefs(props)

let mapR: mapboxgl.Map | null;

onActivated(() => {
    mapR?.resize()
})

//观察地图界面dom变化,地图和图表适应屏幕大小
let observer: ResizeObserver;
let domMy: HTMLElement | null;
const listenerMyMain = () => {
    observer = new ResizeObserver((entries) => {
        mapR?.resize();
    })
    domMy = document.getElementById(mapId.value)
    observer.observe(domMy!)
}

onActivated(() => {
    mapR?.resize()
})


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
        "pk.eyJ1IjoidTEwaW50IiwiYSI6InQtMnZvTkEifQ.c8mhXquPE7_xoB3P4Ag8cA";
    const map = new mapboxgl.Map({
        container: mapId.value,
        projection: "mercator",
        style: style,
        center: [120, 30],
        zoom: 2,
    });

    mapR = map;
    mapR.removeControl(mapR._logoControl);
};

//移除方法
const removeMap = () => {
    mapR?.remove()
    mapR = null;
    observer.unobserve(domMy!)
}

const onOpenDialog = () => {
    initMap()
    listenerMyMain()

    mapR?.on('load', () => {
        emits('exportMap', mapR)
    })

}

const onCloseDialog = () => {
    removeMap()
}

</script>
<style scoped lang='scss'></style>