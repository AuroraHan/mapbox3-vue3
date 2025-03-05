<template>
    <!-- 工具集 -->
    <div id="cesiumContainer"></div>
    <div class="tools">
        <div class="item">
            <div class="title">标记集</div>
            <el-switch v-model="flagCoordinates" />
        </div>
        <div class="item">
            <div class="title">测绘集</div>
            <el-switch v-model="flagMeasureTool" />
        </div>
    </div>
    <Coordinates v-if="flagCoordinates"></Coordinates>
    <MeasureTool v-if="flagMeasureTool"></MeasureTool>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import * as Cesium from 'cesium';
import { useCesium } from '../../hooks/useCesium'
import Coordinates from './components/coordinates/index.vue'
import MeasureTool from './components/measureTool/index.vue'
import { useCesiumS } from '@/stores/cesiumStore'

let cesiumV: Cesium.Viewer;
const { getCesiumViewer } = useCesium({ container: 'cesiumContainer', timeline: false, animation: false })

const flagCoordinates = ref(false)
const flagMeasureTool = ref(false)
onMounted(() => {
    cesiumV = getCesiumViewer()
    useCesiumS().setCesiumS(cesiumV)
})


</script>

<style lang="scss" scoped>
#cesiumContainer {
    height: 100vh;
    width: 100%;
}

.tools {
    position: absolute;
    top: 2%;
    left: 3%;
    width: 200px;
    // height: 40px;
    font-size: 18px;
    border-radius: 3px;
    background-color: beige;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    .item {
        display: flex;
        align-items: center;
        line-height: 40px;
        font-weight: bold;
        color: rgb(49, 58, 55);

        .title {
            margin-right: 10px;
        }
    }
}
</style>