<template>
    <div id="cesiumContainer"></div>
    <div class="lnglat" @click="myBox">
        经度:{{ lnglat.longitude }} &nbsp;纬度:{{ lnglat.latitude }}
    </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import * as Cesium from 'cesium';
import { useCesium } from '../../hooks/useCesium'
import { getCurrentPositionByMouse } from '../../utils/cesiumTools'
import { fragmentShader, fragmentShaderSource2, GeometryPrimitive, makeTexture3D, MyPrimitive, vertexShader, vertexShaderSource2 } from './tools';

let cesiumV: Cesium.Viewer;
const { getCesiumViewer } = useCesium({ container: 'cesiumContainer', infoBox: true })


onMounted(() => {
    cesiumV = getCesiumViewer()
    getLngLat()
    // mushRoom()
})



//根据鼠标获取经纬度
const lnglat = reactive({
    longitude: 0,
    latitude: 0,
    height: 0
})
const getLngLat = () => {
    Cesium.BillboardCollection
    const handler = new Cesium.ScreenSpaceEventHandler(cesiumV.scene.canvas)

    handler.setInputAction((movement: any) => {
        const lnglathig = getCurrentPositionByMouse(cesiumV.scene, movement.endPosition, null)
        if (Cesium.defined(lnglathig)) {
            let carto = Cesium.Cartographic.fromCartesian(lnglathig);
            lnglat.latitude = Number(Cesium.Math.toDegrees(carto.latitude).toFixed(3));
            lnglat.longitude = Number(Cesium.Math.toDegrees(carto.longitude).toFixed(3));
            lnglat.height = Number(carto.height.toFixed(1));
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
}

//自定义实现
const myBox = () => {
    var origin = Cesium.Cartesian3.fromDegrees(120, 30, 25000)
    var modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(origin)

    var primitive = new MyPrimitive(modelMatrix);
    cesiumV.scene.primitives.add(primitive)

    cesiumV.camera.flyTo({
        destination: origin
    })
}



</script>

<style scoped>
#cesiumContainer {
    height: 100vh;
}

.lnglat {
    position: absolute;
    top: 2%;
    left: 3%;
    width: 300px;
    height: 40px;
    text-align: center;
    line-height: 40px;
    font-size: 16px;
    border-radius: 3px;
    background-color: beige;
}
</style>