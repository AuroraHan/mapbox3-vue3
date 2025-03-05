<!--  -->
<template>
    <div>
        <div class="title">图上标绘</div>
        <div class="btns">
            <el-button type="success">标点位</el-button>
            <el-button type="danger">全清空</el-button>
        </div>
    </div>
</template>

<script setup lang='ts'>
import * as Cesium from 'cesium';
import { defineProps, watch, unref, isProxy } from 'vue'
import { useCesiumS } from '@/stores/cesiumStore'

const { viewer } = useCesiumS()

let cViewer = viewer


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