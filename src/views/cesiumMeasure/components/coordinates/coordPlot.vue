<!--  -->
<template>
    <div>
        <div class="title">图上标绘</div>
        <div class="list">
            <div class="name">标绘:</div>
            <el-radio-group v-model="models.plotType">
                <el-radio-button label="点" value="point" />
                <el-radio-button label="线" value="line" />
                <el-radio-button label="面" value="polygon" />
                <el-radio-button label="自定义" value="custom" />
            </el-radio-group>
        </div>
        <div class="list">
            <div class="name">材质:</div>
            <el-select v-model="models.textureType" placeholder="材质" style="width: 180px">
                <el-option v-for="(item, index) in iconList" :key="index" :label="item.label" :value="item.symbolUrl" />
            </el-select>
        </div>
        <div class="list">
            <div class="name">连续标注:</div>
            <el-switch v-model="models.continu" inline-prompt active-text="是" inactive-text="否" />
        </div>

        <div class="btns">
            <el-button type="primary" @click="draw">绘制</el-button>
            <el-button type="info" @click="endDraw">结束绘制</el-button>
            <el-button type="danger">删除</el-button>
        </div>
    </div>
</template>

<script setup lang='ts'>
import * as Cesium from 'cesium';
import { reactive, inject, } from 'vue'
import { IconList } from '../../const/icon'

const iconList = IconList

let cViewer = inject('myViewer') as Cesium.Viewer

const models = reactive({
    plotType: '',
    textureType: '',
    continu: false
})

//点处理函数事件
let pointHandler: Cesium.ScreenSpaceEventHandler

//绘制方法
const draw = () => {
    switch (models.plotType) {
        case 'point':
            drawPoint()
            break;
        case 'line':

            break;
        case 'polygon':

            break;
        default:
            break;
    }
}

//结束绘制
const endDraw = () => {
    switch (models.plotType) {
        case 'point':
            pointHandler && pointHandler.destroy()
            pointHandler = null
            break;
        case 'line':

            break;
        case 'polygon':

            break;
        default:
            break;
    }
}

const drawPoint = () => {
    pointHandler = new Cesium.ScreenSpaceEventHandler(cViewer.scene.canvas);
    pointHandler.setInputAction((click) => {
        // 获取点击位置的笛卡尔坐标
        const ray = cViewer.camera.getPickRay(click.position);
        const cartesian = cViewer.scene.globe.pick(ray!, cViewer.scene);
        console.log(cartesian, ray);

        if (Cesium.defined(cartesian)) {

            // 添加点实体
            const pointEntity = cViewer.entities.add({
                position: cartesian,
                billboard: {
                    image: models.textureType,
                    width: 40, // 图标宽度（像素）
                    height: 40, // 图标高度（像素）
                    scale: 1.0, // 缩放比例
                    color: Cesium.Color.WHITE, // 图标颜色
                    eyeOffset: new Cesium.Cartesian3(0, 0, -10), // 图标偏移
                    pixelOffset: new Cesium.Cartesian2(0, 0), // 像素偏移
                    horizontalOrigin: Cesium.HorizontalOrigin.CENTER, // 水平对齐
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM // 垂直对齐
                }
            });
        }

    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
}



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