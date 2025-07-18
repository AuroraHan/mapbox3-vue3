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
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI4YzI5OGVlNy1jOWY2LTRjNmEtYWYzMC1iNzhkZDhkZmEwOWEiLCJpZCI6MTM2MCwiaWF0IjoxNTI4MTQ0MDMyfQ.itVtUPeeXb7dasKXTUYZ6r3Hbm7OVUoA26ahLaVyj5I";
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
    // ellipsoid()
    baseVoxle()
})

//基础体渲染
const baseVoxle = () => {
    const provider = new ProceduralMultiTileVoxelProvider(
        Cesium.VoxelShapeType.BOX
    );

    const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(
        Cesium.Cartesian3.fromDegrees(106.642372689378, 26.623450331223)
    );

    Cesium.Matrix4.multiplyByTranslation(
        modelMatrix,
        new Cesium.Cartesian3(0, 0, 1000),
        modelMatrix
    );
    const scaleMatrix = Cesium.Matrix4.fromScale(
        new Cesium.Cartesian3(1000, 1000, 1000)
    );
    Cesium.Matrix4.multiply(modelMatrix, scaleMatrix, modelMatrix);

    // Cesium.Matrix4.multiplyByTranslation(
    //     modelMatrix,
    //     new Cesium.Cartesian3(0, 0, 1),
    //     modelMatrix
    // );

    const voxelPrimitive = cesiumV.scene.primitives.add(
        new Cesium.VoxelPrimitive({
            provider: provider,
            customShader: customShader1,
            modelMatrix: modelMatrix,
        })
    );

    cesiumV.flyTo(voxelPrimitive)

    // cesiumV.camera.flyTo({
    //     destination: Cesium.Cartesian3.fromDegrees(106.642372689378, 26.623450331223, 100000),

    // })
}

class ProceduralMultiTileVoxelProvider {
    shape: Cesium.VoxelShapeType;
    dimensions: Cesium.Cartesian3;
    names: string[];
    types: Cesium.MetadataType[];
    componentTypes: Cesium.MetadataComponentType[];
    _levelCount: number;
    constructor(shape: Cesium.VoxelShapeType) {
        this.shape = shape;
        this.dimensions = new Cesium.Cartesian3(4, 4, 4);
        this.names = ["color", "alpha"];
        this.types = [Cesium.MetadataType.VEC4, Cesium.MetadataType.SCALAR];
        this.componentTypes = [
            Cesium.MetadataComponentType.UINT8,
            Cesium.MetadataComponentType.FLOAT32,
        ];
        this._levelCount = 2;
    }
    requestData(options: any) {
        const { tileLevel, tileX, tileY, tileZ } = options;

        if (tileLevel >= this._levelCount) {
            return undefined;
        }

        const dimensions = this.dimensions;

        //元数据：color
        const colorMetadataType = this.types[0];
        const voxelCount = dimensions.x * dimensions.y * dimensions.z;
        const colorChannelCount =
            Cesium.MetadataType.getComponentCount(colorMetadataType);
        const dataColor = new Uint8Array(voxelCount * colorChannelCount).fill(1);

        //元数据：alpha
        // const alphaMetadataType = this.types[1];
        // const alphaChannelCount =
        //     Cesium.MetadataType.getComponentCount(alphaMetadataType);
        // const dataAlpha = new Float32Array(voxelCount * alphaChannelCount).fill(1);

        //按照 names 数组的顺序排列
        const content = Cesium.VoxelContent.fromMetadataArray([dataColor]);
        return Promise.resolve(content);
    }
}

const customShader1 = new Cesium.CustomShader({
    fragmentShaderText: `void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material)
    {
        material.diffuse = fsInput.metadata.color.rgb;
        
    }`,
});


//--------------
//创建球面的体渲染
const ellipsoid = () => {
    const provider = new ProceduralSingleTileVoxelProvider(
        Cesium.VoxelShapeType.ELLIPSOID,
    );
    provider.minBounds.z = 0.0;
    provider.maxBounds.z = 1000000.0;
    const primitive = createPrimitive(provider, customShaderColor, modelMatrix);
    console.log(primitive);
}

//自定义shader
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

//定义颜色
const scratchColor = new Cesium.Color();
//创建体要素
class ProceduralSingleTileVoxelProvider {
    //表示体素的形状
    shape: any;
    minBounds: any;
    maxBounds: any;
    // 表示体素的维度（如 8x8x8）定义体素数据的网格大小
    dimensions: Cesium.Cartesian3;
    //表示体素数据的属性名称 如 ["color"]
    names: string[];
    // 表示体素数据的类型.定义体素数据的结构（如 VEC4 表示 4 个浮点数组成的向量
    types: Cesium.MetadataType[];
    //示体素数据的分量类型.定义体素数据的存储格式（如 FLOAT32 表示 32 位浮点数）。
    componentTypes: Cesium.MetadataComponentType[];
    constructor(shape) {
        this.shape = shape
        //设定最小范围
        this.minBounds = new Cesium.Cartesian3(1.12, 0.24, 0);
        //设定最大范围
        this.maxBounds = new Cesium.Cartesian3(2.4, 0.94, 1000000);
        this.dimensions = new Cesium.Cartesian3(8, 8, 8);
        this.names = ["color"];
        this.types = [Cesium.MetadataType.VEC4];
        this.componentTypes = [Cesium.MetadataComponentType.FLOAT32];
    }

    // 生成体素数据并返回
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

        // 遍历体素网格，为每个体素生成颜色值
        for (let z = 0; z < dimensions.z; z++) {
            for (let y = 0; y < dimensions.y; y++) {
                const indexZY = z * dimensions.y * dimensions.x + y * dimensions.x;
                for (let x = 0; x < dimensions.x; x++) {
                    //计算归一化坐标（lerperX、lerperY、lerperZ）
                    const lerperX = x / (dimensions.x - 1);
                    const lerperY = y / (dimensions.y - 1);
                    const lerperZ = z / (dimensions.z - 1);

                    // 使用随机种子生成基础色调
                    const h = hue + lerperX * 0.5 - lerperY * 0.3 + lerperZ * 0.2;
                    const s = 1.0 - lerperY * 0.2;
                    const v = 0.5 + 2.0 * (lerperZ - 0.5) * 0.2;
                    const color = Cesium.Color.fromHsl(h, s, v, 1.0, scratchColor);

                    //将颜色值存储到 dataColor 数组中
                    const index = (indexZY + x) * channelCount;
                    dataColor[index + 0] = color.red;
                    dataColor[index + 1] = color.green;
                    dataColor[index + 2] = color.blue;
                    dataColor[index + 3] = 0.75;
                }
            }
        }
        // 在版本1.127中需要进行转换 这里容易报错
        const content = Cesium.VoxelContent.fromMetadataArray([dataColor]);
        return Promise.resolve(content);
    }
}

//创建自定义材质
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