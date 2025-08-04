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
    
    uniform float gradationNumber;
	
	czm_material czm_getMaterial(czm_materialInput materialInput)
	{
		vec4 outColor = color;
		czm_material material = czm_getDefaultMaterial(materialInput);

        vec2 st = materialInput.st;
        outColor.r = fract(st.t * gradationNumber);

		material.diffuse = czm_gammaCorrect(outColor.rgb);
		material.alpha = outColor.r;
		return material;
	}
`


const myMaterial = new Cesium.Material({
    translucent: false,
    fabric: {
        type: 'test',
        uniforms: {
            color: new Cesium.Color(1, 1, 0, 1),
            gradationNumber: 3
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

const createInitialPollutionData = (size: any) => {
    const data = new Uint8Array(size * size * size * 4); // RGBA

    // 在中心创建高污染区域
    const center = size / 2;
    for (let z = 0; z < size; z++) {
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const idx = (z * size * size + y * size + x) * 4;
                const dist = Math.sqrt(
                    Math.pow((x - center) / size, 2) +
                    Math.pow((y - center) / size, 2) +
                    Math.pow((z - center) / size, 2)
                );

                // 污染浓度随距离递减
                const value = Math.max(0, 1 - dist * 2) * 255;
                data[idx] = value;     // R: 污染值
                data[idx + 1] = 0;     // G
                data[idx + 2] = 0;     // B
                data[idx + 3] = value; // A: 透明度
            }
        }
    }
    return data;
}

const aa = (viewer: any, center: any, size: any) => {
    // 1. 创建3D纹理
    const textureSize = 32;
    const initialData = createInitialPollutionData(textureSize);

    const pollutionTexture = new Cesium.Texture({
        context: viewer.scene.context,
        width: textureSize,
        height: textureSize,
        depth: textureSize,
        pixelFormat: Cesium.PixelFormat.RGBA,
        pixelDatatype: Cesium.PixelDatatype.UNSIGNED_BYTE,
        source: {
            width: textureSize,
            height: textureSize,
            arrayBufferView: initialData
        }
    });

    // 2. 定义体积边界
    const halfSize = size / 2;
    const boxMin = Cesium.Cartesian3.subtract(center,
        new Cesium.Cartesian3(halfSize, halfSize, halfSize),
        new Cesium.Cartesian3());
    const boxMax = Cesium.Cartesian3.add(center,
        new Cesium.Cartesian3(halfSize, halfSize, halfSize),
        new Cesium.Cartesian3());

    // 3. 创建体积渲染Primitive
    const volumePrimitive = new Cesium.Primitive({
        geometryInstances: new Cesium.GeometryInstance({
            geometry: new Cesium.BoxGeometry({
                minimum: boxMin,
                maximum: boxMax
            }),
            attributes: {
                color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                    new Cesium.Color(1.0, 1.0, 1.0, 0.1)
                )
            }
        }),
        appearance: new Cesium.Appearance({
            fragmentShaderSource: volumeShaderSource,
            renderState: {
                blending: Cesium.BlendingState.ALPHA_BLEND,
                depthTest: {
                    enabled: true,
                    func: Cesium.WebGLConstants.LEQUAL
                }
            }
        }),
        asynchronous: false
    });

    // 4. 设置uniforms
    volumePrimitive.appearance.uniforms = {
        pollutionVolume: pollutionTexture,
        time: 0,
        windDirection: new Cesium.Cartesian3(0.8, 0.2, 0.1),
        diffusionRate: 0.1,
        boxMin: boxMin,
        boxMax: boxMax,
        maxPollution: 100.0
    };

    // 5. 添加到场景
    viewer.scene.primitives.add(volumePrimitive);
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