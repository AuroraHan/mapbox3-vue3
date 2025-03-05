<!--  -->
<template>
    <div>
        <div class="title">图上量算</div>
        <div class="btns">
            <el-button type="success">测距离</el-button>
            <el-button disabled type="success">测距离</el-button>
            <el-button disabled type="success">测高程</el-button>
            <el-button disabled type="success">测高差</el-button>
            <el-button disabled type="success">测面积</el-button>
            <el-button disabled type="success">测角度</el-button>
        </div>
    </div>
</template>

<script setup lang='ts'>
import * as Cesium from 'cesium';
import { defineProps, watch } from 'vue'
const props = defineProps({
    viewer: {
        type: Cesium.Viewer
    }
})
let cViewer = props.viewer

watch(() => props.viewer, (newV) => {
    cViewer = newV
}, { immediate: true })


const test = () => {
    cViewer?.camera.flyTo({
        // 从以度为单位的经度和纬度值返回笛卡尔3位置。
        destination: Cesium.Cartesian3.fromDegrees(120.36, 36.09, 40000),
        orientation: {
            // heading：默认方向为正北，正角度为向东旋转，即水平旋转，也叫偏航角。
            // pitch：默认角度为-90，即朝向地面，正角度在平面之上，负角度为平面下，即上下旋转，也叫俯仰角。
            // roll：默认旋转角度为0，左右旋转，正角度向右，负角度向左，也叫翻滚角
            heading: Cesium.Math.toRadians(0.0), // 正东，默认北
            pitch: Cesium.Math.toRadians(-90), // 向正下方看
            roll: 0.0, // 左右
        },
        duration: 3, // 飞行时间（s）
    })
}
</script>
<style scoped lang='scss'>
.title {
    text-align: center;
    font-size: 17px;
    font-weight: bold;
    margin-bottom: 10px;
}

.btns {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-evenly;
    align-items: center;

    :deep(.el-button) {
        margin-left: 0px;
        margin-bottom: 4px;
    }
}
</style>