<template>
    <div id="cesiumContainer"></div>
    <div class="operate">
        <div class="select" v-for="(ele, index) in tools" :key="index">
            {{ ele.name }}
            <el-switch v-model="ele.enable" />
        </div>
    </div>

    <div class="info">
        <div class="lnglat">
            经度:{{ lnglat.longitude }}° &nbsp;纬度:{{ lnglat.latitude }}° &nbsp;相机高度:{{ lnglat.cameraHeading }}m
        </div>
    </div>


    <video id="trailer" autoplay loop controls>
        <source src="/data/1.mp4" type="video/mp4">
    </video>


    <IntegrationTools v-model="tools[0].enable" :viewerI="cesiumV"></IntegrationTools>
    <AnalysisTools v-model="tools[2].enable" :viewerI="cesiumV"></AnalysisTools>
    <VisualTools v-model="tools[1].enable" :viewerI="cesiumV"></VisualTools>

</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import * as Cesium from 'cesium';
import { useCesium } from '../../hooks/useCesium'
import { getCurrentPositionByMouse } from '../../utils/cesiumTools'
import * as Turf from '@turf/turf'
import { tools } from './config'
import AnalysisTools from './components/analysisTools.vue';
import VisualTools from './components/visualTools.vue';
import IntegrationTools from './components/integrationTools.vue'

let cesiumV: Cesium.Viewer;
const { getCesiumViewer } = useCesium({ container: 'cesiumContainer', timeline: false, animation: false })



onMounted(() => {
    baseConfig()
    timeFilter()
})

const baseConfig = () => {
    cesiumV = getCesiumViewer()
    getLngLat()
    geojsonPri()
    // add()
}

//根据鼠标获取经纬度
const lnglat = reactive({
    longitude: 0,
    latitude: 0,
    height: 0,
    cameraHeading: 0,
    FPS: 0,
    FPStime: ''
})
const getLngLat = () => {
    const handler = new Cesium.ScreenSpaceEventHandler(cesiumV.scene.canvas)

    //获取经纬度
    handler.setInputAction((movement) => {
        const lnglathig = getCurrentPositionByMouse(cesiumV.scene, movement.endPosition, null)

        if (Cesium.defined(lnglathig)) {
            let carto = Cesium.Cartographic.fromCartesian(lnglathig);
            lnglat.latitude = Number(Cesium.Math.toDegrees(carto.latitude).toFixed(5));
            lnglat.longitude = Number(Cesium.Math.toDegrees(carto.longitude).toFixed(5));
            // lnglat.height = Number(carto.height.toFixed(1));

        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

    //获取相机高度
    handler.setInputAction(() => {
        lnglat.cameraHeading = Number(cesiumV.camera.positionCartographic.height.toFixed(2))
    }, Cesium.ScreenSpaceEventType.WHEEL)

}

//添加3dTiles
const add3DTiles = async () => {
    const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(96188);
    cesiumV.scene.primitives.add(tileset);
}

//添加点数据
const addPoint = () => {
    cesiumV.entities.add({
        name: 'dian',
        position: Cesium.Cartesian3.fromDegrees(112, 31),
        point: {
            pixelSize: 5,
            color: Cesium.Color.RED,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2,
            //根据相机与点的距离动态调整点的透明度。
            translucencyByDistance: new Cesium.NearFarScalar(1000, 1.0, 10000, 0.5),
            //根据相机与点的距离控制点的显示条件 表示在距离1000米到10000米之间时显示点。
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(1000, 10000)
        },
        label: {
            text: 'aaa',
            font: '18px',
            showBackground: true,
            backgroundColor: Cesium.Color.RED
        }
    })
}

const add = () => {
    const videoElement = document.getElementById("trailer");

    const videoMaterial = new Cesium.Material({
        fabric: {
            type: 'Image',
            uniforms: {
                Image: videoElement,
                flipY: true
            }
        }
    })
    const redWall = cesiumV.entities.add({
        name: "Red wall at height",
        wall: {
            positions: Cesium.Cartesian3.fromDegreesArrayHeights([
                105.0, 44.0, 0.0, 115.0, 44.0, 0.0,
            ]),
            minimumHeights: [400000.0, 400000.0],
            // maximumHeights: [400000.0, 200000.0],
            material: videoElement,
        },
    });

    const greenWall = cesiumV.entities.add({
        name: "Green wall from surface with outline",
        wall: {
            positions: Cesium.Cartesian3.fromDegreesArrayHeights([
                103, 27, 100000.0,
                113, 27, 100000.0,
                113, 33.0, 100000.0,
                103, 33.0, 100000.0,
                103, 27, 100000.0,
            ]),
            material: Cesium.Color.GREEN,
            // outline: true,
        },
    });


    const sphere = cesiumV.entities.add({
        position: Cesium.Cartesian3.fromDegrees(120, 31, 1000),
        ellipsoid: {
            radii: new Cesium.Cartesian3(1000, 1000, 1000),
            material: videoElement,
        },
    });

}



//飞行动画
const flyTo = () => {
    //平滑过渡到目标位置	需要动画效果的场景（如飞行、漫游）
    cesiumV.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(109.85, 19.21, 100000),
        //用这个，不卡顿，否则会在终点卡顿！！
        easingFunction: Cesium.EasingFunction.LINEAR_NONE,
        //持续时间
        duration: 5,
        //飞行动画完成的回调
        complete: () => {
            console.log('kkkk');
        }
    })

    //立即设置相机位置和方向	初始化、快速切换视角
    // cesiumV.camera.setView({
    //     destination: Cesium.Cartesian3.fromDegrees(116.39, 39.9, 80000), // 经度, 纬度, 高度
    //     orientation: {
    //         heading: Cesium.Math.toRadians(45), // 朝向东北
    //         pitch: Cesium.Math.toRadians(-30),  // 俯仰角
    //         roll: 0                             // 无翻滚
    //     }
    // });
}

//添加geojson数据
const chinaGeo = async () => {
    const data = await Cesium.GeoJsonDataSource.load('/geojson/dep-conc-time.geojson', {
        stroke: Cesium.Color.HOTPINK,
        fill: Cesium.Color.PINK.withAlpha(0.1),
    })
    cesiumV.dataSources.add(data)

    return data
}

const filterByTime = (dataSource: Cesium.GeoJsonDataSource, timeRange: number) => {
    const entities = dataSource.entities.values;
    for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        const Hour = entity.properties.Hour; // 假设time是属性名
        // 判断是否在时间范围内
        entity.show = Hour == timeRange;
    }
}

const timeFilter = async () => {
    const geojson = await chinaGeo()
    filterByTime(geojson, 1)

}


//创建基础primitive
const createPrimitive = () => {
    const a = Cesium.BoxGeometry.fromDimensions({
        vertexFormat: Cesium.VertexFormat.POSITION_AND_NORMAL,
        dimensions: new Cesium.Cartesian3(1000.0, 1000.0, 100.0) // 正方体边长 100 米
    })
    const instance = new Cesium.GeometryInstance({
        geometry: a,
        id: 'object',
        modelMatrix: Cesium.Matrix4.multiplyByTranslation(
            Cesium.Transforms.eastNorthUpToFixedFrame(
                Cesium.Cartesian3.fromDegrees(120, 30),
            ),
            new Cesium.Cartesian3(0.0, 0.0, 100),
            new Cesium.Matrix4(),
        ),
        attributes: {
            // 所有实例颜色相同（若需不同颜色，使用 ColorGeometryInstanceAttribute）
            color: new Cesium.ColorGeometryInstanceAttribute(0.0, 1.0, 0.0, 1.0)
        }
    });

    const instance1 = new Cesium.GeometryInstance({
        geometry: a,
        id: 'object',
        modelMatrix: Cesium.Matrix4.multiplyByTranslation(
            Cesium.Transforms.eastNorthUpToFixedFrame(
                Cesium.Cartesian3.fromDegrees(120.01038445705325, 29.999999592511273),
            ),
            new Cesium.Cartesian3(0.0, 0.0, 100),
            new Cesium.Matrix4(),
        ),
        attributes: {
            // 所有实例颜色相同（若需不同颜色，使用 ColorGeometryInstanceAttribute）
            color: new Cesium.ColorGeometryInstanceAttribute(1.0, 1.0, 0.0, 1.0)
        }
    });

    // 3. 创建 Primitive 并批量渲染
    const primitive = new Cesium.Primitive({
        geometryInstances: [instance, instance1],
        appearance: new Cesium.PerInstanceColorAppearance(),
        asynchronous: false     // 同步加载（适合静态数据）
    });
    cesiumV.scene.primitives.add(primitive);
    cesiumV.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(120, 30, 1000),
    })
}

const geojsonPri = async () => {
    const result = await fetch('/geojson/grid_points.geojson').then((data) => data.json())
    // debugger
    const instances: Cesium.GeometryInstance[] = [];

    const boxGeometry = Cesium.BoxGeometry.fromDimensions({
        vertexFormat: Cesium.VertexFormat.POSITION_AND_NORMAL,
        dimensions: new Cesium.Cartesian3(1000.0, 1000.0, 1000.0) // 正方体边长 100 米
    })

    for (let i = 0; i < 3; i++) {
        const h = i * 500
        const c = Math.random()
        for (const item of result.features) {
            instances.push(new Cesium.GeometryInstance({
                geometry: boxGeometry,
                modelMatrix: Cesium.Matrix4.multiplyByTranslation(
                    Cesium.Transforms.eastNorthUpToFixedFrame(
                        Cesium.Cartesian3.fromDegrees(item.geometry.coordinates[0], item.geometry.coordinates[1]),
                    ),
                    new Cesium.Cartesian3(0.0, 0.0, h),
                    new Cesium.Matrix4(),
                ),
                attributes: {
                    // 所有实例颜色相同（若需不同颜色，使用 ColorGeometryInstanceAttribute）
                    color: new Cesium.ColorGeometryInstanceAttribute(
                        Cesium.Color.fromRandom().red,
                        Cesium.Color.fromRandom().green,
                        Cesium.Color.fromRandom().blue,
                        1.0
                    )
                    // color: new Cesium.ColorGeometryInstanceAttribute(1.0, c, 0.0, 1.0)
                }
            }))
        }
    }
    // 3. 创建 Primitive 并批量渲染
    const primitive = new Cesium.Primitive({
        geometryInstances: instances,
        appearance: new Cesium.PerInstanceColorAppearance(),
        asynchronous: false     // 同步加载（适合静态数据）
    });
    cesiumV.scene.primitives.add(primitive);
}


</script>

<style lang="scss" scoped>
@import './index.scss';
</style>