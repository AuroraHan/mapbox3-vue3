<template>
    <div id="cesiumContainer">
        <div class="options">
            <button @click="addModel">添加模型</button>
            <button @click="play">播放动画</button>
            <button @click="pause">暂停动画</button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import * as Cesium from 'cesium';
import { useCesium } from '@/hooks/useCesium'
import { ModelRotateController } from '@/utils/ModelRotate';


let cesiumV: Cesium.Viewer;
let rotateController: ModelRotateController
const { getCesiumViewer } = useCesium({ container: 'cesiumContainer', addTerrain: false, infoBox: false, shouldAnimate: true })
onMounted(() => {
    cesiumV = getCesiumViewer()
    rotateController = new ModelRotateController(cesiumV)
    addGLB()
})

//添加模型
const addModel = () => {
    const modelEntity = cesiumV.entities.add({
        name: 'Cesium Air',
        position: Cesium.Cartesian3.fromDegrees(120, 30, 0),
        model: {
            uri: '/models/Cesium_Air.glb',
            minimumPixelSize: 128,
            maximumScale: 20000
        }
    });

    rotateController.add(modelEntity);
    // cesiumV.trackedEntity = modelEntity;
}

//模型动画并播放
let modelAnimations: Cesium.Model;
const addGLB = async () => {
    modelAnimations = await Cesium.Model.fromGltfAsync({
        url: "/models/AAAAAAA.glb",
        modelMatrix: Cesium.Transforms.eastNorthUpToFixedFrame(
            Cesium.Cartesian3.fromDegrees(120, 30, 0)
        ),
        scale: 1
    })

    cesiumV.scene.primitives.add(modelAnimations)
    cesiumV.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(120, 30, 100),
        duration: 2
    })
}

const play = () => {
    modelAnimations.activeAnimations.addAll({
        loop: Cesium.ModelAnimationLoop.REPEAT
    })
}

const pause = () => {
    modelAnimations.activeAnimations.removeAll()
}

</script>

<style scoped>
#cesiumContainer {
    height: 100vh;
    position: relative;
}

.options {
    position: absolute;
    left: 3%;
    top: 3%;
    width: 100px;
    height: 50px;
}
</style>