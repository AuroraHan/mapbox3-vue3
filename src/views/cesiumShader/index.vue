<template>
    <div id="cesiumContainer"></div>
    <div class="lnglat">
        经度:{{ lnglat.longitude }} &nbsp;纬度:{{ lnglat.latitude }}
    </div>
</template>

<script setup lang="ts">
import { onMounted, reactive } from 'vue';
import * as Cesium from 'cesium';
import { useCesium } from '../../hooks/useCesium'
import { getCurrentPositionByMouse } from '../../utils/cesiumTools'

let cesiumV: Cesium.Viewer;
const { getCesiumViewer } = useCesium({ container: 'cesiumContainer' })

onMounted(() => {
    cesiumV = getCesiumViewer()
    getLngLat()
    shaderBox()
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


const shaderSource = `
	uniform vec4 color;
	
	czm_material czm_getMaterial(czm_materialInput materialInput)
	{
		vec4 outColor = color;
		czm_material material = czm_getDefaultMaterial(materialInput);

        vec2 st = materialInput.st;
        outColor.r = st.t;

		material.diffuse = czm_gammaCorrect(outColor.rgb);
		material.alpha = st.t;
		return material;
	}
`


const myMaterial = new Cesium.Material({
    translucent: false,
    fabric: {
        type: 'test',
        uniforms: {
            color: new Cesium.Color(1, 0, 0, 1),
        },
        source: shaderSource
    }
})

const appearance = new Cesium.MaterialAppearance({
    material: myMaterial,
})


const boxPrimitive = new Cesium.Primitive({
    geometryInstances: new Cesium.GeometryInstance({
        geometry: Cesium.BoxGeometry.fromDimensions({
            dimensions: new Cesium.Cartesian3(1000, 1000, 1000)
        }),
        modelMatrix: Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(112, 31, 1000))
    }),
    appearance
})

const shaderBox = () => {

    cesiumV.scene.primitives.add(boxPrimitive)
    cesiumV.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(112, 31, 10000),
        duration: 0
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