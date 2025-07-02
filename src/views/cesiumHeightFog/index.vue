<template>
    <div id="cesiumContainer"></div>
    <div class="lnglat" @click="addFogBox">
        经度:{{ lnglat.longitude }} &nbsp;纬度:{{ lnglat.latitude }}
    </div>
</template>

<script setup lang="ts">
import { onMounted, reactive } from 'vue';
import * as Cesium from 'cesium';
import { useCesium } from '../../hooks/useCesium'
import { getCurrentPositionByMouse } from '../../utils/cesiumTools'
import * as dat from 'dat.gui';
import { fragmentShader, fragmentShaderArea, fragmentShaderBox } from './fs'

let cesiumV: Cesium.Viewer;
const { getCesiumViewer } = useCesium({ container: 'cesiumContainer', addTerrain: true })

onMounted(async () => {
    cesiumV = getCesiumViewer()
    // 开启帧率
    cesiumV.scene.debugShowFramesPerSecond = true;
    // 深度监测
    cesiumV.scene.globe.depthTestAgainstTerrain = true;

    getLngLat()
})

//根据鼠标获取经纬度
const lnglat = reactive({
    longitude: 0,
    latitude: 0,
    height: 0
})
const getLngLat = () => {
    const handler = new Cesium.ScreenSpaceEventHandler(cesiumV.scene.canvas)

    handler.setInputAction((movement) => {
        const lnglathig = getCurrentPositionByMouse(cesiumV.scene, movement.endPosition, null)
        if (Cesium.defined(lnglathig)) {
            let carto = Cesium.Cartographic.fromCartesian(lnglathig);
            lnglat.latitude = Number(Cesium.Math.toDegrees(carto.latitude).toFixed(3));
            lnglat.longitude = Number(Cesium.Math.toDegrees(carto.longitude).toFixed(3));
            lnglat.height = Number(carto.height.toFixed(1));
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
}

const viewModel = {
    //烟雾高度
    fogHeight: 1000,
    //烟雾浓度
    globalDensity: 0.6,
    //烟雾颜色
    fogColor: [0, 128, 255]
}
//添加高度雾
const addHeightFog = () => {
    const viewer = cesiumV
    const customPostProcessStage = new Cesium.PostProcessStage({
        fragmentShader: fragmentShader,
        uniforms: {
            u_earthRadiusOnCamera: () => Cesium.Cartesian3.magnitude(viewer.camera.positionWC) - viewer.camera.positionCartographic.height,
            u_cameraHeight: () => viewer.camera.positionCartographic.height,
            u_fogColor: () => new Cesium.Color(viewModel.fogColor[0] / 255, viewModel.fogColor[1] / 255, viewModel.fogColor[2] / 255),
            u_fogHeight: () => viewModel.fogHeight,
            u_globalDensity: () => viewModel.globalDensity,
        }
    })

    viewer.scene.postProcessStages.add(customPostProcessStage)
    viewer.camera.setView({
        destination: new Cesium.Cartesian3(-1386705.7605894802, 5226754.975571179, 3375582.2076837276),
        orientation: {
            heading: 3.968066845543675, // east, default value is 0.0 (north)
            pitch: -0.300780994602595,    // default value (looking down)
            roll: 0.00007913394522685024                           // default value
        }
    });

    var gui = new dat.GUI();
    gui.domElement.style = 'position:absolute;top:10px;left:10px;'
    gui.add(viewModel, 'fogHeight', 1, 5000)
    gui.add(viewModel, 'globalDensity', 0, 2)
    gui.addColor(viewModel, 'fogColor')
}


//一定范围内高度雾
const addAreaFog = () => {
    const viewer = cesiumV
    const customPostProcessStage = new Cesium.PostProcessStage({
        fragmentShader: fragmentShaderArea,  // 使用修改后的GLSL代码
        uniforms: {
            u_earthRadiusOnCamera: () => Cesium.Cartesian3.magnitude(viewer.camera.positionWC) - viewer.camera.positionCartographic.height,
            u_cameraHeight: () => viewer.camera.positionCartographic.height,
            u_fogColor: () => new Cesium.Color(0.8, 0.82, 0.84),
            u_fogHeight: () => 1000,
            u_globalDensity: () => 0.6,
            // 新增范围控制参数
            u_fogCenter: () => Cesium.Cartesian3.fromDegrees(113.54, 38.26, 0), // 北京坐标示例
            u_fogRadius: () => 50000 // 雾效半径50公里
        }
    });

    viewer.scene.postProcessStages.add(customPostProcessStage)
    viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(113.54, 38.26, 100000),
    })
}

//正方体范围
const addFogBox = () => {
    const viewer = cesiumV
    const customPostProcessStage = new Cesium.PostProcessStage({
        fragmentShader: fragmentShaderBox,  // 使用下面修改后的GLSL代码
        uniforms: {
            u_earthRadiusOnCamera: () => Cesium.Cartesian3.magnitude(viewer.camera.positionWC) - viewer.camera.positionCartographic.height,
            u_cameraHeight: () => viewer.camera.positionCartographic.height,
            u_fogColor: () => new Cesium.Color(0.8, 0.82, 0.84),
            u_fogHeight: () => 1000,
            u_globalDensity: () => 0.6,
            // 新增正方形区域参数
            u_fogCenter: () => Cesium.Cartesian3.fromDegrees(113.54, 38.26, 0), // 中心点坐标
            u_fogHalfSize: () => 20000 // 正方形半边长5公里(总边长10公里)
        }
    });
    viewer.scene.postProcessStages.add(customPostProcessStage)
    viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(113.54, 38.26, 100000),
    })
}
</script>

<style scoped>
#cesiumContainer {
    height: 100vh;
}

.lnglat {
    position: absolute;
    bottom: 5%;
    right: 2%;
    width: 300px;
    height: 40px;
    text-align: center;
    line-height: 40px;
    font-size: 16px;
    border-radius: 3px;
    background-color: beige;
}
</style>