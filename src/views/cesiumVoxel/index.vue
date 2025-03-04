<template>
    <!-- 体渲染 -->
    <div id="cesiumContainer"></div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import * as Cesium from 'cesium';

let cesiumV: Cesium.Viewer;

const initCesium = () => {
    Cesium.Ion.defaultAccessToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYTQ2ZjdjNS1jM2E0LTQ1M2EtOWM0My1mODMzNzY3YjYzY2YiLCJpZCI6MjkzMjcsInNjb3BlcyI6WyJhc3IiLCJnYyJdLCJpYXQiOjE1OTE5NDIzNjB9.RzKlVTVDTQ9r7cqCo-PDydgUh8Frgw0Erul_BVxiS9c";
    const viewer = new Cesium.Viewer("cesiumContainer", {
        baseLayerPicker: false,
        geocoder: false,
        animation: false,
        timeline: false,
    });

    cesiumV = viewer
}

onMounted(() => {
    initCesium()
    cesiumV.extend(Cesium.viewerVoxelInspectorMixin);
    cesiumV.scene.debugShowFramesPerSecond = true;
    ellipsoid()
})

//创建球面的体渲染
const ellipsoid = () => {
    const provider = new ProceduralSingleTileVoxelProvider(
        Cesium.VoxelShapeType.ELLIPSOID,
    );
    provider.minBounds.z = 0.0;
    provider.maxBounds.z = 1000000.0;
    const primitive = createPrimitive(provider, customShaderColor, modelMatrix);
}

const customShaderColor = new Cesium.CustomShader({
    fragmentShaderText: `void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material)
  {
      material.diffuse = fsInput.metadata.color.rgb;
      float transparency = 1.0 - fsInput.metadata.color.a;

      float thickness = fsInput.voxel.travelDistance * 16.0;
      material.alpha = 1.0 - pow(transparency, thickness);
  }`,
});

const modelMatrix = Cesium.Matrix4.fromScale(
    Cesium.Cartesian3.fromElements(
        Cesium.Ellipsoid.WGS84.maximumRadius,
        Cesium.Ellipsoid.WGS84.maximumRadius,
        Cesium.Ellipsoid.WGS84.maximumRadius,
    ),
);

const scratchColor = new Cesium.Color();
class ProceduralSingleTileVoxelProvider {
    shape: any;
    minBounds: any;
    maxBounds: any;
    dimensions: Cesium.Cartesian3;
    names: string[];
    types: Cesium.MetadataType[];
    componentTypes: Cesium.MetadataComponentType[];
    constructor(shape) {
        this.shape = shape
        this.minBounds = Cesium.VoxelShapeType.getMinBounds(shape).clone();
        this.maxBounds = Cesium.VoxelShapeType.getMaxBounds(shape).clone();
        this.dimensions = new Cesium.Cartesian3(8, 8, 8);
        this.names = ["color"];
        this.types = [Cesium.MetadataType.VEC4];
        this.componentTypes = [Cesium.MetadataComponentType.FLOAT32];
        console.log(this.minBounds);
        console.log(this.maxBounds);
    }

    requestData(options) {
        if (options.tileLevel >= 1) {
            return Promise.reject(`No tiles available beyond level 0`);
        }

        const dimensions = this.dimensions;
        const voxelCount = dimensions.x * dimensions.y * dimensions.z;
        const type = this.types[0];
        const channelCount = Cesium.MetadataType.getComponentCount(type);
        const dataColor = new Float32Array(voxelCount * channelCount);

        const randomSeed = dimensions.y * dimensions.x + dimensions.x;
        Cesium.Math.setRandomNumberSeed(randomSeed);
        const hue = Cesium.Math.nextRandomNumber();

        for (let z = 0; z < dimensions.z; z++) {
            for (let y = 0; y < dimensions.y; y++) {
                const indexZY = z * dimensions.y * dimensions.x + y * dimensions.x;
                for (let x = 0; x < dimensions.x; x++) {
                    const lerperX = x / (dimensions.x - 1);
                    const lerperY = y / (dimensions.y - 1);
                    const lerperZ = z / (dimensions.z - 1);

                    const h = hue + lerperX * 0.5 - lerperY * 0.3 + lerperZ * 0.2;
                    const s = 1.0 - lerperY * 0.2;
                    const v = 0.5 + 2.0 * (lerperZ - 0.5) * 0.2;
                    const color = Cesium.Color.fromHsl(h, s, v, 1.0, scratchColor);

                    const index = (indexZY + x) * channelCount;
                    dataColor[index + 0] = color.red;
                    dataColor[index + 1] = color.green;
                    dataColor[index + 2] = color.blue;
                    dataColor[index + 3] = 0.75;
                }
            }
        }
        // 在版本1.127中不需要进行转换
        // const content = Cesium.VoxelContent.fromMetadataArray([dataColor]);
        return Promise.resolve([dataColor]);
    }
}

//创建自定义
const createPrimitive = (provider, customShader, modelMatrix) => {
    cesiumV.scene.primitives.removeAll();

    const voxelPrimitive = cesiumV.scene.primitives.add(
        new Cesium.VoxelPrimitive({
            provider: provider,
            customShader: customShader,
            modelMatrix: modelMatrix,
        }),
    );

    cesiumV.voxelInspector.viewModel.voxelPrimitive = voxelPrimitive;
    cesiumV.camera.flyToBoundingSphere(voxelPrimitive.boundingSphere, {
        duration: 0.0,
    });

    return voxelPrimitive;
}
</script>

<style lang="scss" scoped>
#cesiumContainer {
    height: 100vh;
}
</style>