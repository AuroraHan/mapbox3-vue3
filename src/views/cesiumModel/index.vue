<template>
    <div id="cesiumContainer">
        <div class="options">
            <button @click="addModel">添加模型</button>
            <button @click="play1">播放动画</button>
            <button @click="pause">暂停动画</button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import * as Cesium from 'cesium';
import { useCesium } from '@/hooks/useCesium'
import { ModelRotateController } from '@/utils/ModelRotate';
import * as turf from '@turf/turf';
import { ModelRotator, ModelZRotator } from './utils';


let cesiumV: Cesium.Viewer;
let rotateController: ModelRotateController
const { getCesiumViewer } = useCesium({ container: 'cesiumContainer', addTerrain: false, infoBox: false, shouldAnimate: true })
onMounted(() => {
    cesiumV = getCesiumViewer()
    addModel()

    addHealthBar()
    // rotateController = new ModelRotateController(cesiumV)
})

//添加模型
let rotator;
const addModel = async () => {
    // const modelEntity = cesiumV.entities.add({
    //     name: 'Cesium Air',
    //     position: Cesium.Cartesian3.fromDegrees(120, 30, 0),
    //     model: {
    //         uri: '/models/Cesium_Air.glb',
    //         minimumPixelSize: 128,
    //         maximumScale: 20000
    //     }
    // });

    const model = await Cesium.Model.fromGltfAsync({
        url: "/models/Cesium_Air.glb",
        modelMatrix: Cesium.Transforms.eastNorthUpToFixedFrame(
            Cesium.Cartesian3.fromDegrees(116.39, 39.9, 0)
        )
    })

    cesiumV.scene.primitives.add(model)

    rotator = new ModelZRotator(cesiumV, model)

    // 监听旋转角度
    rotator.onRotate((deg) => {
        console.log("当前角度:", deg)
    })

    // rotateController.add(modelEntity);
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

//添加血条效果
const addHealthBar = () => {
    const pos = Cesium.Cartesian3.fromDegrees(120, 30, 0);
    const healthBarEntity = cesiumV.entities.add({
        name: 'Health Bar',
        position: pos,
        label: {
            text: '血条',
            font: '14px sans-serif',
            fillColor: Cesium.Color.RED,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -20)
        }
    });

    const div = createHealthBar()

    // ✅ 关键：每帧更新
    cesiumV.scene.postRender.addEventListener(() => {
        const position = healthBarEntity.position.getValue(cesiumV.clock.currentTime);

        if (!position) return;

        const canvasPosition = Cesium.SceneTransforms.worldToWindowCoordinates(
            cesiumV.scene,
            position
        );

        if (canvasPosition) {
            div.style.left = canvasPosition.x - 30 + 'px';
            div.style.top = canvasPosition.y - 50 + 'px';
            div.style.display = 'block';
        } else {
            div.style.display = 'none';
        }
    });

}


const createHealthBar = () => {
    const el = document.createElement('div');
    el.className = 'hp-bar';
    el.innerHTML = `<div class="hp-inner"></div>`;
    el.style.position = 'absolute';
    el.style.width = '60px';
    el.style.height = '6px';
    el.style.background = '#333';
    el.style.borderRadius = '3px';
    el.style.pointerEvents = 'none';

    document.body.appendChild(el);

    return el;
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
    z-index: 99;
}
</style>