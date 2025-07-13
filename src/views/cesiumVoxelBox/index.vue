<template>
    <!-- 体渲染 -->
    <div id="cesiumContainer"></div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import * as Cesium from 'cesium';
import { useCesium } from '../../hooks/useCesium'

let cesiumV: Cesium.Viewer;

const { getCesiumViewer } = useCesium({ container: 'cesiumContainer', infoBox: true })
const initCesium = () => {
    cesiumV = getCesiumViewer()
}

onMounted(() => {
    initCesium()
    // geojsonPri()
    // tempRander()
    // geojsonPri1()
    // test3()
    render()
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
            feature.properties.height || 1000
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


const geojsonPri1 = async () => {
    const result = await fetch('/geojson/temperature_field.geojson').then((data) => data.json())
    // debugger
    const instances: Cesium.GeometryInstance[] = [];

    const boxGeometry = Cesium.BoxGeometry.fromDimensions({
        vertexFormat: Cesium.VertexFormat.POSITION_AND_NORMAL,
        dimensions: new Cesium.Cartesian3(1000.0, 1000.0, 500.0) // 正方体边长 100 米
    })

    for (const item of result.features) {

        const temp = item.properties.temperature;
        const color = getColorByTemp(temp);

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
                color: Cesium.ColorGeometryInstanceAttribute.fromColor(color)
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


//=============
const test3 = async () => {
    const result = await fetch('/public/geojson/conc-time-linux.geojson').then((data) => data.json())
    const data = result.features.filter((ele: any) => {
        return ele.properties.Hour == 4
    })

    const instances: Cesium.GeometryInstance[] = [];

    const boxGeometry = Cesium.BoxGeometry.fromDimensions({
        vertexFormat: Cesium.VertexFormat.POSITION_AND_NORMAL,
        dimensions: new Cesium.Cartesian3(1000.0, 1000.0, 500.0) // 正方体边长 100 米
    })

    for (const item of data) {

        instances.push(new Cesium.GeometryInstance({
            geometry: boxGeometry,
            modelMatrix: Cesium.Matrix4.multiplyByTranslation(
                Cesium.Transforms.eastNorthUpToFixedFrame(
                    Cesium.Cartesian3.fromDegrees(item.geometry.coordinates[0][0][0], item.geometry.coordinates[0][0][1]),
                ),
                new Cesium.Cartesian3(0.0, 0.0, 0),
                new Cesium.Matrix4(),
            ),
            attributes: {
                color: new Cesium.ColorGeometryInstanceAttribute(1.0, 1.0, 0.0, 1.0)
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

    cesiumV.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(125.7182120747035, 39.8251270095359, 100000),
    })
}

//============
//测试动态渲染
let currentPrimitive: Cesium.Primitive | null = null;
// 按 Hour 分类存储数据
const hourDataMap = new Map<number, any[]>();

const minHeight = 100;
const maxHeight = 2000;
const minConc = 1e8;  // 你的最小浓度值
const maxConc = 1e11; // 你的最大浓度值

const loadData = async () => {
    // 加载所有数据
    const result = await fetch('/geojson/conc-time-linux.geojson').then((data) => data.json());
    for (let hour = 1; hour <= 6; hour++) {
        const filtered = result.features.filter((ele: any) => ele.properties.Hour === hour);
        hourDataMap.set(hour, filtered);
    }
}

const getColorByConcentration = (conc: number) => {
    // 这里可以根据你的浓度范围定义颜色渐变
    if (conc > 1e10) return Cesium.Color.RED.withAlpha(0.9);
    if (conc > 1e9) return Cesium.Color.ORANGE.withAlpha(0.9);
    if (conc > 1e8) return Cesium.Color.YELLOW.withAlpha(0.9);
    return Cesium.Color.GREEN.withAlpha(0.9);
}

const renderByHour = (hour: number, cesiumV: Cesium.Viewer) => {
    // 移除之前的primitive
    if (currentPrimitive) {
        cesiumV.scene.primitives.remove(currentPrimitive);
    }

    const data = hourDataMap.get(hour);
    if (!data) return;

    const instances: Cesium.GeometryInstance[] = [];

    for (const item of data) {
        // 根据浓度值设置颜色
        const conc = item.properties.Conc;
        const color = getColorByConcentration(conc);

        // 线性映射浓度到高度
        const height = Cesium.Math.lerp(
            minHeight,
            maxHeight,
            Cesium.Math.clamp((conc - minConc) / (maxConc - minConc), 0, 1)
        );

        const boxGeometry = Cesium.BoxGeometry.fromDimensions({
            vertexFormat: Cesium.VertexFormat.POSITION_AND_NORMAL,
            dimensions: new Cesium.Cartesian3(1000.0, 1000.0, height)
        });

        instances.push(new Cesium.GeometryInstance({
            geometry: boxGeometry,
            modelMatrix: Cesium.Matrix4.multiplyByTranslation(
                Cesium.Transforms.eastNorthUpToFixedFrame(
                    Cesium.Cartesian3.fromDegrees(
                        item.geometry.coordinates[0][0][0],
                        item.geometry.coordinates[0][0][1]
                    ),
                ),
                new Cesium.Cartesian3(0.0, 0.0, height / 2),
                new Cesium.Matrix4(),
            ),
            attributes: {
                color: Cesium.ColorGeometryInstanceAttribute.fromColor(color)
            }
        }));
    }

    currentPrimitive = new Cesium.Primitive({
        geometryInstances: instances,
        appearance: new Cesium.PerInstanceColorAppearance(),
        asynchronous: false
    });

    cesiumV.scene.primitives.add(currentPrimitive);
}

let currentHour = 1;
const render = async () => {
    await loadData()
    renderByHour(4, cesiumV)

    // setInterval(() => {
    //     currentHour = currentHour > 6 ? 1 : currentHour;
    //     renderByHour(currentHour, cesiumV);
    //     currentHour++;
    // }, 2000)
}
</script>

<style lang="scss" scoped>
#cesiumContainer {
    height: 100vh;
}
</style>