<template>
    <div id="cesiumContainer"></div>
    <MyDialog ref="mydialog" :positionXY="pos"></MyDialog>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive } from 'vue';
import * as Cesium from 'cesium';
import { useCesium } from '../../hooks/useCesium'
import MyDialog from '/@/components/cesiumPopupTwo/index.vue';

let cesiumV: Cesium.Viewer;
const { getCesiumViewer } = useCesium({ container: 'cesiumContainer', infoBox: false, shouldAnimate: true })

const mydialog = ref()

onMounted(() => {
    cesiumV = getCesiumViewer()
    //弹窗

    demoVueComp()
})


//案例四 使用vue组件弹出框
const pos = reactive({
    xAxis: 0,
    yAxis: 0
})
const demoVueComp = () => {
    //添加实体
    const entityOne = cesiumV.entities.add({
        name: '标识',
        position: Cesium.Cartesian3.fromDegrees(120, 30, 2000),
        model: {
            uri: '/models/CesiumDrone.glb',
            minimumPixelSize: 92,
            maximumScale: 20000,
        },
        description: '描述',
        data: {
            name: '公益性公园'
        }
    })

    let handle = new Cesium.ScreenSpaceEventHandler(cesiumV.scene.canvas)
    handle.setInputAction((clickEvent: any) => {
        let pickData = cesiumV.scene.pick(clickEvent.position)

        //存在则打开弹出框
        if (Cesium.defined(pickData)) {
            let scratch = new Cesium.Cartesian2();
            cesiumV.scene.preRender.addEventListener(() => {
                //获取模型的坐标数据
                const modelPos = pickData.primitive.id.position.getValue()
                let position = new Cesium.Cartesian3(modelPos.x, modelPos.y, modelPos.z);
                let canvasPosition = cesiumV.scene.cartesianToCanvasCoordinates(position, scratch);

                if (Cesium.defined(canvasPosition)) {
                    pos.xAxis = canvasPosition.x - 100
                    pos.yAxis = canvasPosition.y - 70
                }
            })

            mydialog.value.openDialog()
        } else {
            mydialog.value.closeDialog()
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)


    // setInterval(() => {
    //     entityOne.position = Cesium.Cartesian3.fromDegrees(100 + Math.random() * 22, 20 + Math.random() * 16, Math.random() * 3000)
    // }, 4000)
}

</script>

<style>
#cesiumContainer {
    height: 100vh;
}
</style>