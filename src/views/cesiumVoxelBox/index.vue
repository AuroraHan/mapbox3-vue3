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
    const provider = new ProceduralSingleTileVoxelProvider(Cesium.VoxelShapeType.ELLIPSOID);

    const voxelPrimitive = cesiumV.scene.primitives.add(
        new Cesium.VoxelPrimitive({
            provider: provider,
            customShader: customShader,
            modelMatrix: modelMatrix,
        }),
    );

    voxelPrimitive.nearestSampling = true;

    cesiumV.camera.flyToBoundingSphere(voxelPrimitive.boundingSphere, {
        duration: 0.0,
    });

}

//自定义shader
const customShader = new Cesium.CustomShader({

    fragmentShaderText: `void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material)
    {
      vec3 voxelNormal = normalize(czm_normal * fsInput.voxel.surfaceNormal);
      float diffuse = max(0.0, dot(voxelNormal, czm_lightDirectionEC));
      float lighting = 0.5 + 0.5 * diffuse;

      int tileIndex = fsInput.voxel.tileIndex;
      int sampleIndex = fsInput.voxel.sampleIndex;
      vec3 cellColor = fsInput.metadata.color.rgb * lighting;
      if (tileIndex == u_selectedTile && sampleIndex == u_selectedSample) {
            material.diffuse = mix(cellColor, vec3(1.0), 0.5);
            material.alpha = fsInput.metadata.color.a;
      } else {
            material.diffuse = cellColor;
            material.alpha = fsInput.metadata.color.a;
      }
    }`,
    uniforms: {
        u_selectedTile: {
            type: Cesium.UniformType.INT,
            value: -1.0,
        },
        u_selectedSample: {
            type: Cesium.UniformType.INT,
            value: -1.0,
        },
    },
});

const modelMatrix = Cesium.Matrix4.fromScale(
    Cesium.Cartesian3.fromElements(
        Cesium.Ellipsoid.WGS84.maximumRadius,
        Cesium.Ellipsoid.WGS84.maximumRadius,
        Cesium.Ellipsoid.WGS84.maximumRadius,
    ),
);

// 创建随机数据
const constructRandomTileData = (dimensions, type, randomSeed) => {
    Cesium.Math.setRandomNumberSeed(randomSeed);
    const voxelCount = dimensions.x * dimensions.y * dimensions.z;
    const channelCount = Cesium.MetadataType.getComponentCount(type);
    const dataColor = new Float32Array(voxelCount * channelCount);

    for (let z = 0; z < dimensions.z; z++) {
        const indexZ = z * dimensions.y * dimensions.x;
        for (let y = 0; y < dimensions.y; y++) {
            const indexZY = indexZ + y * dimensions.x;
            for (let x = 0; x < dimensions.x; x++) {
                const lerperX = x / (dimensions.x - 1);
                const lerperY = y / (dimensions.y - 1);
                const lerperZ = z / (dimensions.z - 1);

                const h = Cesium.Math.nextRandomNumber();
                const s = 1.0 - lerperY * 0.2;
                const l = 0.5;
                const color = Cesium.Color.fromHsl(h, s, l, 1.0, scratchColor);

                const random2 = Cesium.Math.nextRandomNumber();
                const alphaRandom = Math.floor(random2 + 0.5);

                const index = (indexZY + x) * channelCount;
                dataColor[index + 0] = color.red;
                dataColor[index + 1] = color.green;
                dataColor[index + 2] = color.blue;
                dataColor[index + 3] = alphaRandom;
            }
        }
    }

    return dataColor;
}

//定义颜色
const scratchColor = new Cesium.Color();

//创建体要素
class ProceduralSingleTileVoxelProvider {
    shape: any;
    dimensions: Cesium.Cartesian3;
    names: string[];
    types: Cesium.MetadataType[];
    componentTypes: Cesium.MetadataComponentType[];
    _levelCount: number;
    minBounds: Cesium.Cartesian3;
    maxBounds: Cesium.Cartesian3;

    constructor(shape) {
        this.shape = shape;
        this.dimensions = new Cesium.Cartesian3(4, 4, 4);
        //设定最小范围
        this.minBounds = new Cesium.Cartesian3(1.9, 0.54, 0);
        //设定最大范围
        this.maxBounds = new Cesium.Cartesian3(2.3, 0.94, 1000000);
        this.names = ["color"];
        this.types = [Cesium.MetadataType.VEC4];
        this.componentTypes = [Cesium.MetadataComponentType.FLOAT32];
        this._levelCount = 3;
    }

    // 生成体素数据并返回
    requestData(options) {
        const { tileLevel, tileX, tileY, tileZ } = options;

        if (tileLevel >= this._levelCount) {
            return Promise.reject(`No tiles available beyond level ${this._levelCount}`);
        }

        const dimensions = this.dimensions;
        const type = this.types[0];
        const randomSeed =
            tileZ * dimensions.y * dimensions.x + tileY * dimensions.x + tileX;
        const dataTile = constructRandomTileData(dimensions, type, randomSeed);

        const content = Cesium.VoxelContent.fromMetadataArray([dataTile]);
        return Promise.resolve(content);
    }
}


</script>

<style lang="scss" scoped>
#cesiumContainer {
    height: 100vh;
}
</style>