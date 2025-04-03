<template>
    <div id="cesiumContainer"></div>
    <div class="lnglat" @click="geojsonPri">
        经度:{{ lnglat.longitude }} &nbsp;纬度:{{ lnglat.latitude }}
    </div>
</template>

<script setup lang="ts">
import { onMounted, reactive } from 'vue';
import * as Cesium from 'cesium';
import { useCesium } from '../../hooks/useCesium'
import { getCurrentPositionByMouse } from '../../utils/cesiumTools'
import * as Turf from '@turf/turf'

import krigingExport from 'kriging'
const { kriging } = krigingExport

let cesiumV: Cesium.Viewer;
const { getCesiumViewer } = useCesium({ container: 'cesiumContainer' })

onMounted(() => {
    cesiumV = getCesiumViewer()
    getLngLat()
    // addPoint()
    // add()
    // createPrimitive()
    stainRain()
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
    var point = Turf.point([120, 30.0]);
    var distance = 1;
    var bearing = 90;
    var options = { units: "kilometers" };
    //@ts-ignore
    var destination = Turf.destination(point, distance, bearing, options);
    console.log(destination, 'kkkk');

    const blueBox = cesiumV.entities.add({
        name: "Blue box",
        position: Cesium.Cartesian3.fromDegrees(120, 30.0, 100.0),
        box: {
            dimensions: new Cesium.Cartesian3(1000.0, 1000.0, 100.0),
            material: Cesium.Color.BLUE,
        },
    });

    const blueBox1 = cesiumV.entities.add({
        name: "Blue box",
        position: Cesium.Cartesian3.fromDegrees(120.01038445705325, 29.999999592511273, 100.0),
        box: {
            dimensions: new Cesium.Cartesian3(1000.0, 1000.0, 100.0),
            material: Cesium.Color.RED,
        },
    });

    cesiumV.zoomTo(cesiumV.entities)
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
const chinaGeo = () => {
    const data = Cesium.GeoJsonDataSource.load('/geojson/fusc1.geojson', {
        stroke: Cesium.Color.HOTPINK,
        fill: Cesium.Color.PINK.withAlpha(0.1),
    })

    data.then((data) => {
        cesiumV.dataSources.add(data)
        // const entities = data.entities.values
        // for (const entity of entities) {
        //     //@ts-ignore
        //     entity.polygon.extrudedHeight = Math.random() * 100000

        //     entity.polygon.material = Cesium.Color.RED
        // }
        // console.log(data.entities.values);
    })

    cesiumV.flyTo(data);

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
        dimensions: new Cesium.Cartesian3(1000.0, 1000.0, 500.0) // 正方体边长 100 米
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
                    // color: new Cesium.ColorGeometryInstanceAttribute(
                    //     Cesium.Color.fromRandom().red,
                    //     Cesium.Color.fromRandom().green,
                    //     Cesium.Color.fromRandom().blue,
                    //     1.0
                    // )
                    color: new Cesium.ColorGeometryInstanceAttribute(1.0, c, 0.0, 1.0)
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

//-----------------色斑图--------------


// 平均年降水量，单位mm。适用范围：江西
const jxPrecipitationColors = [
    { min: 0, max: 1000, color: "#7fffff" },
    { min: 1000, max: 1100, color: "#23b7ff" },
    { min: 1100, max: 1200, color: "#0177b4" },
    { min: 1200, max: 1400, color: "#0052ca" },
    { min: 1400, max: 1600, color: "#0310d8" },
    { min: 1600, max: 1800, color: "#9601f9" },
    { min: 1800, max: 2000, color: "#6f00b8" },
    { min: 2000, max: 10000, color: "#4c0082" }
]

//降雨色斑图
const stainRain = async () => {
    // 绘制色斑图需要的数据
    const lngs: number[] = []  	//经度数组
    const lats: number[] = []  	//纬度数组
    const vals: number[] = []		//数值数组
    const mode: 'gaussian' | 'exponential' | 'spherical' = 'exponential' //变异函数模型
    const sigma2 = 0  					// (σ2)高斯过程的方差参数
    const alpha = 100 					// (α)变异函数模型的先验
    const gridDivideNum = 500		// 根据格网的宽度/该数量划分格网单元大小

    // 加载江西省各县年平均降水量数据
    const precipitationProm = await fetch('/geojson/jxPrecipitation.geojson')
    const precipitationData = await precipitationProm.json()
    precipitationData.features.forEach((item: any) => {
        const geom = item.geometry
        const prop = item.properties
        lngs.push(geom.coordinates[0])
        lats.push(geom.coordinates[1])
        vals.push(prop.y2020)

        cesiumV.entities.add({
            position: Cesium.Cartesian3.fromDegrees(geom.coordinates[0], geom.coordinates[1]),
            point: {
                pixelSize: 6,
                color: Cesium.Color.YELLOW,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2
            },
            label: {
                text: Number(prop.y2020).toFixed(0),
                fillColor: Cesium.Color.BLACK,
                horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
                pixelOffset: new Cesium.Cartesian2(6, 0),
                font: '16px TimesNewRoman',
            }
        })
    })
    // 加载江西省矢量
    const jxProm = await fetch('/geojson/jiangxi.geojson')
    const jxData = await jxProm.json()
    const jxPolygon = jxData.features[0].geometry.coordinates[0] as [number, number][][]
    const polygonCartesians = Cesium.Cartesian3.fromDegreesArray(jxPolygon[0].flat())

    // 绘制矢量
    cesiumV.entities.add({
        polygon: {
            hierarchy: polygonCartesians,
            fill: false,
            outline: true,
            outlineWidth: 4,
            outlineColor: Cesium.Color.YELLOW
        }
    })
    const grid = await generateGrid({
        lngs,
        lats,
        vals,
        polygon: jxPolygon[0],
        asynchronous: true,
        mode: 'exponential',
        sigma2: 0,
        alpha: 100,
        gridDivideNum: 500,
    })

    // 进行绘图
    const canvas = document.createElement('canvas')
    canvas.width = 1000
    canvas.height = 1000
    canvas.style.display = 'block'
    canvas.getContext('2d')!.globalAlpha = 1.0
    console.time('绘图')
    newPlot(canvas, grid, grid.xlim, grid.ylim, jxPrecipitationColors)
    console.timeEnd('绘图')
    // 下载绘制出的图片进行查看
    // const imgUrl = canvas.toDataURL('image/jpeg')
    // const link = document.createElement('a')
    // link.href = imgUrl
    // link.download = 'scene.jpeg'
    // link.click()

    const polygonGeom = new Cesium.PolygonGeometry({
        polygonHierarchy: new Cesium.PolygonHierarchy(polygonCartesians),
    })
    const primitive = new Cesium.GroundPrimitive({
        geometryInstances: new Cesium.GeometryInstance({
            geometry: polygonGeom
        }),
        appearance: new Cesium.Appearance({
            material: Cesium.Material.fromType('Image', {
                image: canvas
            })
        })
    })
    cesiumV.scene.primitives.add(primitive)
}

const newPlot = (canvas: HTMLCanvasElement, grid: any, xlim: number[], ylim: number[], colors: any) => {
    let ctx = canvas.getContext("2d")!
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    let range = [xlim[1] - xlim[0], ylim[1] - ylim[0], grid.zlim[1] - grid.zlim[0]]
    let i, j, x, y, z
    let n = grid.length
    let m = grid[0].length
    let wx = Math.ceil(grid.width * canvas.width / (xlim[1] - xlim[0]))
    let wy = Math.ceil(grid.width * canvas.height / (ylim[1] - ylim[0]))
    for (i = 0; i < n; i++) {
        for (j = 0; j < m; j++) {
            if (grid[i][j] == undefined) continue;
            x = canvas.width * (i * grid.width + grid.xlim[0] - xlim[0]) / range[0]
            y = canvas.height * (1 - (j * grid.width + grid.ylim[0] - ylim[0]) / range[1])
            z = (grid[i][j] - grid.zlim[0]) / range[2]
            if (z < 0.0) z = 0.0
            if (z > 1.0) z = 1.0
            ctx.fillStyle = getColor(colors, grid[i][j])
            ctx.fillRect(Math.round(x - wx / 2), Math.round(y - wy / 2), wx, wy)
        }
    }
}

type ColorOpt = { min: number, max: number, color: string }


const getColor = (colors: ColorOpt[], z: number) => {
    const len = colors.length
    let minVal = colors[0].min
    for (var i = 0; i < len; i++) {
        minVal = Math.min(minVal, colors[i].min)
        if (z >= colors[i].min && z < colors[i].max) return colors[i].color
    }
    if (z <= minVal) {
        return colors[0].color
    }
    else {
        return colors[len - 1].color
    }

}

//灵活使用webworke
type GridOptions = {
    lngs: number[]
    lats: number[]
    vals: number[]
    polygon: [number, number][]
    asynchronous: boolean
    mode: 'gaussian' | 'exponential' | 'spherical',
    sigma2: number
    alpha: number
    gridDivideNum: number
}
const generateGrid = (options: GridOptions) => {
    return new Promise<any>((resolve) => {
        const { lngs, lats, vals, polygon, mode, sigma2, alpha, gridDivideNum } = options
        if (!options.asynchronous) {
            const polygonCartesians = Cesium.Cartesian3.fromDegreesArray(polygon.flat())

            //寻找边界框的4个值
            const polygonExtentRect = Cesium.PolygonGeometry.computeRectangleFromPositions(polygonCartesians)

            const minx = Cesium.Math.toDegrees(polygonExtentRect.west)
            const miny = Cesium.Math.toDegrees(polygonExtentRect.south)
            const maxx = Cesium.Math.toDegrees(polygonExtentRect.east)
            const maxy = Cesium.Math.toDegrees(polygonExtentRect.north)
            const polygonExtentCoords = [[[minx, miny], [maxx, miny], [maxx, maxy], [minx, maxy]]] as [number, number][][]
            // 训练并得到格网
            const variogram = kriging.train(vals, lngs, lats, mode, sigma2, alpha)
            const grid = kriging.grid(polygonExtentCoords, variogram, (maxx - minx) / gridDivideNum)

            resolve(grid)
        }
        else {
            const worker = new Worker(new URL('./kergingWk.ts', import.meta.url), {
                type: 'module'
            })
            worker.postMessage(options)
            worker.onmessage = e => {
                const grid = e.data

                resolve(grid)
            }
        }
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