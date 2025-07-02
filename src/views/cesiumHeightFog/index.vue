<template>
    <div id="cesiumContainer"></div>
    <div class="lnglat" @click="addHeightFog">
        经度:{{ lnglat.longitude }} &nbsp;纬度:{{ lnglat.latitude }}
    </div>
</template>

<script setup lang="ts">
import { onMounted, reactive } from 'vue';
import * as Cesium from 'cesium';
import { useCesium } from '../../hooks/useCesium'
import { getCurrentPositionByMouse } from '../../utils/cesiumTools'
import * as dat from 'dat.gui';

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

const fs =
    `
        uniform sampler2D colorTexture;  // 颜色纹理
        uniform sampler2D depthTexture;  // 深度纹理
        in vec2 v_textureCoordinates;  // 纹理坐标
        uniform float u_earthRadiusOnCamera;
        uniform float u_cameraHeight;
        uniform float u_fogHeight;
        uniform vec3 u_fogColor;
        uniform float u_globalDensity;

        // 通过深度纹理与纹理坐标得到世界坐标
        vec4 getWorldCoordinate(sampler2D depthTexture, vec2 texCoords) {
            float depthOrLogDepth = czm_unpackDepth(texture(depthTexture, texCoords));
            vec4 eyeCoordinate = czm_windowToEyeCoordinates(gl_FragCoord.xy, depthOrLogDepth);
            eyeCoordinate = eyeCoordinate / eyeCoordinate.w;
            vec4 worldCoordinate = czm_inverseView * eyeCoordinate;
            worldCoordinate = worldCoordinate / worldCoordinate.w;
            return worldCoordinate;
        }

        // 计算粗略的高程，依赖js传递的相机位置处的地球高程u_earthRadiusOnCamera。好处是计算量非常低
        float getRoughHeight(vec4 worldCoordinate) {
            float disToCenter = length(vec3(worldCoordinate));
            return disToCenter - u_earthRadiusOnCamera;
        }


        // 得到a向量在b向量的投影长度，如果同向结果为正，异向结果为复
        float projectVector(vec3 a, vec3 b) {
            float scale = dot(a, b) / dot(b, b);
            float k = scale / abs(scale);
            return k * length(scale * b);
        }

        // 线性浓度积分高度雾
        float linearHeightFog(vec3 positionToCamera, float cameraHeight, float pixelHeight, float fogMaxHeight) {
            float globalDensity = u_globalDensity / 10.0;
            vec3 up = -1.0 * normalize(czm_viewerPositionWC);
            float vh = projectVector(normalize(positionToCamera), up);
        
            // 让相机沿着视线方向移动 雾气产生距离 的距离
            float s = step(100.0, length(positionToCamera));
            vec3 sub = mix(positionToCamera, normalize(positionToCamera) * 100.0, s);
            positionToCamera -= sub;
            cameraHeight = mix(pixelHeight, cameraHeight - 100.0 * vh, s);
        
            float b = mix(cameraHeight, fogMaxHeight, step(fogMaxHeight, cameraHeight));
            float a = mix(pixelHeight, fogMaxHeight, step(fogMaxHeight, pixelHeight));
        
            float fog = (b - a) - 0.5 * (pow(b, 2.0) - pow(a, 2.0)) / fogMaxHeight;
            fog = globalDensity * fog / vh;
        
            if(abs(vh) <= 0.01 && cameraHeight < fogMaxHeight) {
                float disToCamera = length(positionToCamera);
                fog = globalDensity * (1.0 - cameraHeight / fogMaxHeight) * disToCamera;
            }
        
            fog = mix(0.0, 1.0, fog / (fog + 1.0));
        
            return fog;
        }


        void main(void) {
            vec4 color = texture(colorTexture, v_textureCoordinates);
            vec4 positionWC = getWorldCoordinate(depthTexture, v_textureCoordinates);
            float pixelHeight = getRoughHeight(positionWC);
            vec3 positionToCamera = vec3(vec3(positionWC) - czm_viewerPositionWC);
            float fog = linearHeightFog(positionToCamera, u_cameraHeight, pixelHeight, u_fogHeight);
            out_FragColor = mix(color, vec4(u_fogColor, 1.0), fog);
        }
`
const viewModel = {
    //烟雾高度
    fogHeight: 1000,
    //烟雾浓度
    globalDensity: 0.6
}
//添加高度雾
const addHeightFog = () => {
    const viewer = cesiumV
    const customPostProcessStage = new Cesium.PostProcessStage({
        fragmentShader: fs,
        uniforms: {
            u_earthRadiusOnCamera: () => Cesium.Cartesian3.magnitude(viewer.camera.positionWC) - viewer.camera.positionCartographic.height,
            u_cameraHeight: () => viewer.camera.positionCartographic.height,
            u_fogColor: () => new Cesium.Color(0.8, 0.82, 0.84),
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