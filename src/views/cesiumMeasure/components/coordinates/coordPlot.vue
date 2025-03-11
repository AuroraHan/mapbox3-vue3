<!--  -->
<template>
    <div>
        <div class="title">图上标绘</div>
        <div class="list">
            <div class="name">标绘:</div>
            <el-radio-group v-model="models.plotType">
                <el-radio-button label="点" value="New York" />
                <el-radio-button label="线" value="Washington" />
                <el-radio-button label="面" value="Los Angeles" />
                <el-radio-button label="自定义" value="Chicago" />
            </el-radio-group>
        </div>
        <div class="list">
            <div class="name">材质:</div>
            <el-select v-model="models.textureType" placeholder="材质" style="width: 180px">
                <el-option label="医院" value="医院" />
                <el-option label="学校" value="学校" />
            </el-select>
        </div>
        <div class="list">
            <div class="name">连续标注:</div>
            <el-switch v-model="models.continu" inline-prompt active-text="是" inactive-text="否" />
        </div>

        <div class="btns">
            <el-button type="primary">绘制</el-button>
            <el-button type="danger">删除</el-button>
        </div>
    </div>
</template>

<script setup lang='ts'>
import * as Cesium from 'cesium';
import { reactive, watch, inject, provide } from 'vue'


let cViewer = inject('myViewer') as Cesium.Viewer

const models = reactive({
    plotType: '',
    textureType: '',
    continu: false
})

</script>
<style scoped lang='scss'>
.title {
    text-align: center;
    font-size: 17px;
    font-weight: bold;
    margin-bottom: 10px;
}

.list {
    display: flex;
    align-items: center;
    margin-bottom: 10px;

    .name {
        font-size: 17px;
        font-weight: bold;
        margin-right: 8px;
    }
}

.btns {
    display: flex;
    justify-content: center;
}
</style>