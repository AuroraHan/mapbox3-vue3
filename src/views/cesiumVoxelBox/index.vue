<template>
    <!-- 体渲染 -->
    <div id="cesiumContainer"></div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import * as Cesium from 'cesium';
import { useCesium } from '../../hooks/useCesium'

let cesiumV: Cesium.Viewer;

const { getCesiumViewer } = useCesium({ container: 'cesiumContainer', timeline: false, animation: false })
const initCesium = () => {
    cesiumV = getCesiumViewer()
}

onMounted(() => {
    initCesium()
    // geojsonPri()
    tempRander()
})

const geojsonPri = async () => {
    const result = await fetch('/geojson/grid_points.geojson').then((data) => data.json())
    // debugger
    const instances: Cesium.GeometryInstance[] = [];

    const boxGeometry = Cesium.BoxGeometry.fromDimensions({
        vertexFormat: Cesium.VertexFormat.POSITION_AND_NORMAL,
        dimensions: new Cesium.Cartesian3(1000.0, 1000.0, 1000.0) // 正方体边长 100 米
    })


    const c = Math.random()
    for (const item of result.features) {
        instances.push(new Cesium.GeometryInstance({
            geometry: boxGeometry,
            modelMatrix: Cesium.Matrix4.multiplyByTranslation(
                Cesium.Transforms.eastNorthUpToFixedFrame(
                    Cesium.Cartesian3.fromDegrees(item.geometry.coordinates[0], item.geometry.coordinates[1]),
                ),
                new Cesium.Cartesian3(0.0, 0.0, 0),
                new Cesium.Matrix4(),
            ),
            attributes: {
                // 所有实例颜色相同（若需不同颜色，使用 ColorGeometryInstanceAttribute）
                // color: new Cesium.ColorGeometryInstanceAttribute(
                //     Cesium.Color.red,
                //     Cesium.Color.fromRandom().green,
                //     Cesium.Color.fromRandom().blue,
                //     1.0
                // )
                color: new Cesium.ColorGeometryInstanceAttribute(0.0, 1.0, 0.0, 1.0)
            }
        }))
    }

    // 3. 创建 Primitive 并批量渲染
    const primitive = new Cesium.Primitive({
        geometryInstances: instances,
        appearance: new Cesium.PerInstanceColorAppearance(),
        asynchronous: false     // 同步加载（适合静态数据）
    });
    cesiumV.scene.primitives.add(primitive);
}


//============

const getColorByTemp = (temp: number) => {
    // 假设温度范围0-40℃映射到蓝-红
    const normalized = Cesium.Math.clamp((temp - 0) / 40, 0, 1);
    return Cesium.Color.fromHsl(
        (1.0 - normalized) * 0.6, // 蓝(0.6)到红(0.0)
        1.0,
        0.5
    );
}

const tempRander = async () => {
    // 1. 加载温度数据
    const tempData = await fetch('/geojson/temperature_field.geojson').then(res => res.json());

    // 3. 创建几何实例
    const instances = [];
    const rectangleSize = 100; // 矩形面片大小(米)

    tempData.features.forEach(feature => {
        const position = Cesium.Cartesian3.fromDegrees(
            feature.geometry.coordinates[0],
            feature.geometry.coordinates[1],
            feature.properties.height || 0
        );

        const temp = feature.properties.temperature;
        const color = getColorByTemp(temp);

        // 创建矩形面片
        instances.push(new Cesium.GeometryInstance({
            geometry: new Cesium.RectangleGeometry({
                rectangle: Cesium.Rectangle.fromCartesianArray([
                    Cesium.Cartesian3.add(
                        position,
                        new Cesium.Cartesian3(-rectangleSize / 2, -rectangleSize / 2, 0),
                        new Cesium.Cartesian3()
                    ),
                    Cesium.Cartesian3.add(
                        position,
                        new Cesium.Cartesian3(rectangleSize / 2, rectangleSize / 2, 0),
                        new Cesium.Cartesian3()
                    )
                ]),
                height: 0,
                vertexFormat: Cesium.VertexFormat.POSITION_AND_COLOR
            }),
            attributes: {
                color: Cesium.ColorGeometryInstanceAttribute.fromColor(color)
            }
        }));
    });

    // 4. 创建Primitive
    const primitive = new Cesium.Primitive({
        geometryInstances: instances,
        appearance: new Cesium.PerInstanceColorAppearance({
            flat: true,
            translucent: false
        }),
        asynchronous: false
    });

    cesiumV.scene.primitives.add(primitive);
}

</script>

<style lang="scss" scoped>
#cesiumContainer {
    height: 100vh;
}
</style>