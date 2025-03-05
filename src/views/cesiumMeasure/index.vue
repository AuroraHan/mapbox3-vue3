<template>
    <!-- 工具集 -->
    <div id="cesiumContainer"></div>
    <div class="tools">
        <div class="item">
            <div class="title">工具集</div>
            <el-switch v-model="flag" />
        </div>
    </div>
    <Coordinates v-if="flag" :viewer="cesiumV"></Coordinates>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import * as Cesium from 'cesium';
import { useCesium } from '../../hooks/useCesium'
import Coordinates from './components/coordinates/index.vue'

let cesiumV = ref<Cesium.Viewer>();
const { getCesiumViewer } = useCesium({ container: 'cesiumContainer', timeline: false, animation: false })

const flag = ref(false)

onMounted(() => {
    cesiumV.value = getCesiumViewer()
    // measure()
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