<template>
    <div class="top-controls">
        <div class="lonlat" @click="canvasToImage">
            经度:{{ Number(jw?.lng).toFixed(5) }} 纬度:{{ Number(jw?.lat).toFixed(5) }} 层级:{{ zoom.toFixed(1) }}
        </div>
        <div class="operate">
            <div>工具集</div>
            <el-switch v-model="controls.isOprate" />
        </div>
    </div>
    <div id="map" class="map"></div>

    <!-- 下拉列表  -->
    <div v-if="controls.isOprate" class="oparate">
        <el-collapse accordion>
            <el-collapse-item title="工具集" name="1">
                <div class="tools">
                    <div class="item">
                        <div class="title">测量工具</div>
                        <el-switch v-model="controls.isDraw" />
                    </div>
                    <div class="item">
                        <div class="title">标绘</div>
                        <el-switch v-model="controls.isEquipment" />
                    </div>
                </div>
            </el-collapse-item>
        </el-collapse>
    </div>

    <!-- 测量工具组件 -->
    <DrawTools v-if="controls.isDraw" :drawI="Draw" :mapI="mapR"></DrawTools>

    <!-- 装备类 -->
    <EquipmentManage v-if="controls.isEquipment" :mapI="mapR"></EquipmentManage>
</template>

<script setup lang="ts">
import { onMounted, ref, createApp, reactive } from 'vue'
import * as Cesium from 'cesium';
import krigingExport from 'kriging'
const { kriging } = krigingExport
import mapbox, { Marker, PointLike } from 'mapbox-gl';
import GlobeMinimap from "mapbox-gl-globe-minimap";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import { AnimatedGIF, CanvasIcon } from '@sakitam-gis/viz-mapbox-gl';
import { useMapbox } from '../../hooks/useMapBox'
import Popup from './components/popup.vue';
import { createImg } from '../../utils/mapTools'
import DrawTools from './components/drawTools.vue';
import EquipmentManage from './components/equipmentManage.vue'

let mapR: mapboxgl.Map;
let Draw: any;

const { getMap } = useMapbox({ container: 'map', isOffline: false })

//当前经纬度
const jw = ref<{ lat: number, lng: number }>({ lat: 0, lng: 0 });

//当前缩放层级
const zoom = ref<Number>(0)

onMounted(() => {
    baseConfig()
})

//弹出框实例
const popup = new mapbox.Popup({
    closeButton: false,
});


//控制工具类
const controls = reactive({
    isDraw: false,
    isEquipment: false,
    isOprate: false
})

//基础配置
const baseConfig = () => {
    mapR = getMap()!

    //加载地球仪组件
    mapR?.addControl(
        //@ts-ignore
        new GlobeMinimap({
            globeSize: 150,
            landColor: "#4ebf6e",
            waterColor: "#8dcbe3"
        }),
        "bottom-right"
    );

    const scale = new mapbox.ScaleControl();
    mapR.addControl(scale);

    //加载绘制组件
    Draw = new MapboxDraw({
        controls: {
            'combine_features': false,
            'uncombine_features': false,
        }
    });
    mapR.addControl(Draw, 'top-right');
    // 将元素隐藏起来
    const dom = document.getElementsByClassName('mapbox-gl-draw_ctrl-draw-btn')
    for (let i = 0; i < dom.length; i++) {
        //@ts-ignore
        dom[i].style.display = 'none';
    }


    mapR.on('load', () => {
        addPoint()
        // stainRain()
        fillImage()
    })

    mapR.on('mousemove', (e: { lngLat: { lat: number, lng: number } }) => {
        jw.value = e.lngLat;
    })

    mapR.on('click', ['wrjpoint'], (e) => {
        const bbox = [
            [e.point.x - 5, e.point.y - 5],
            [e.point.x + 5, e.point.y + 5]
        ] as [PointLike, PointLike];
        //自定义点击图层
        const hdFeatures = mapR!.queryRenderedFeatures(bbox)
        console.log(hdFeatures);
    })

    mapR.on('zoom', () => {
        zoom.value = mapR.getZoom() as Number;
    })

    mapR.on('moveend', () => {
    })
}

//生成截图
const canvasToImage = () => {

    // preserveDrawingBuffer
    // mapR.getConfigProperty('preserveDrawingBuffer', 'true');
    // mapR._preserveDrawingBuffer = true
    // 获取地图 Canvas 元素
    const canvas = mapR.getCanvas();

    // 将 Canvas 转换为 Base64 格式的 PNG 图片
    const dataURL = canvas.toDataURL('image/png');

    // 创建下载链接
    const link = document.createElement('a');
    link.download = 'map-snapshot.png';
    link.href = dataURL;
    link.click();
}

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

//使用克里金插值降雨量
const stainRain = async () => {
    // 绘制色斑图需要的数据
    const lngs: number[] = []  	//经度数组
    const lats: number[] = []  	//纬度数组
    const vals: number[] = []		//数值数组
    const mode: 'gaussian' | 'exponential' | 'spherical' = 'exponential' //变异函数模型
    const sigma2 = 0  					// (σ2)高斯过程的方差参数
    const alpha = 100 					// (α)变异函数模型的先验
    const gridDivideNum = 500

    // 加载江西省各县年平均降水量数据
    const precipitationProm = await fetch('/geojson/jxPrecipitation.geojson')
    const precipitationData = await precipitationProm.json()

    precipitationData.features.forEach((item: any) => {
        const geom = item.geometry
        const prop = item.properties
        lngs.push(geom.coordinates[0])
        lats.push(geom.coordinates[1])
        vals.push(prop.y2020)
    })

    // 加载江西省矢量
    const jxProm = await fetch('/geojson/jiangxi.geojson')
    const jxData = await jxProm.json()




    const jxPolygon = jxData.features[0].geometry.coordinates[0] as [number, number][][]
    const polygonCartesians = Cesium.Cartesian3.fromDegreesArray(jxPolygon[0].flat())

    //寻找4个边界框的值
    const polygonExtentRect = Cesium.PolygonGeometry.computeRectangleFromPositions(polygonCartesians)
    const minx = Cesium.Math.toDegrees(polygonExtentRect.west)
    const miny = Cesium.Math.toDegrees(polygonExtentRect.south)
    const maxx = Cesium.Math.toDegrees(polygonExtentRect.east)
    const maxy = Cesium.Math.toDegrees(polygonExtentRect.north)

    console.time('训练模型')
    const variogram = kriging.train(vals, lngs, lats, mode, sigma2, alpha)
    console.timeEnd('训练模型')
    console.time('生成格网')
    // const grid = kriging.grid(jxPolygon, variogram, (maxx - minx) / gridDivideNum)

    const polygonExtentCoords = [[[minx, miny], [maxx, miny], [maxx, maxy], [minx, maxy]]] as [number, number][][]
    const grid = kriging.grid(polygonExtentCoords, variogram, (maxx - minx) / gridDivideNum)
    console.timeEnd('生成格网')

    // 进行绘图
    const canvas = document.createElement('canvas')
    canvas.width = 1000
    canvas.height = 1000
    canvas.style.display = 'block'
    canvas.getContext('2d')!.globalAlpha = 0.6
    console.time('绘图')
    newPlot(canvas, grid, grid.xlim, grid.ylim, jxPrecipitationColors)
    console.timeEnd('绘图')

    mapR.addSource('canvas-source', {
        type: 'canvas',
        canvas: canvas,
        coordinates: [
            [minx, maxy],
            [maxx, maxy],
            [maxx, miny],
            [minx, miny]
        ],

    });

    mapR.addLayer({
        id: 'canvas-layer',
        type: 'raster',
        source: 'canvas-source'
    });

    mapR.addSource('fill1', {
        type: 'geojson',
        data: jxData
    })

    mapR.addLayer({
        id: 'outline',
        type: 'line',
        source: 'fill1',
        layout: {},
        paint: {
            'line-color': '#c62457',
            'line-width': 2
            // 'fill-color': '#c62457',
            // 'fill-pattern': 'rocket'
        },
    });
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

//添加自定义弹出框
const getSiteInfo = (data: any) => {
    if (data?.properties) {
        const container = document.createElement('div')
        //@ts-ignore
        createApp(Popup, { objInfo: data.properties }).mount(container)
        //@ts-ignore
        popup.setLngLat(data.geometry.coordinates).setDOMContent(container).addTo(mapR!)
    }
}

//
const addPoint = () => {
    mapR.addSource('test', {
        type: 'geojson',
        data: '/geojson/grid_points.geojson'
    })

    mapR.addLayer({
        id: 'test',
        source: 'test',
        type: 'circle',
        paint: {
            'circle-color': '#ff0000',
        },
    })
}

//在面上填充图片
const fillImage = () => {

    mapR?.loadImage('/images/single1.png', (error, image) => {
        if (error) throw error;
        // Add the loaded image to the style's sprite with the ID 'kitten'.
        mapR?.addImage('single', image!);
    });

    const geojson = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {},
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [114.37572837947951, 30.575221013547498],
                            [114.3757270588289, 30.590323321294157],
                            [114.39163798378583, 30.590311111419275],
                            [114.3916393065189, 30.57520880452885],
                            [114.37572837947951, 30.575221013547498]
                        ]
                    ]
                }
            }
        ]
    }

    mapR.addSource('fill1', {
        type: 'geojson',
        data: geojson
    })

    mapR.addLayer({
        id: 'outline',
        type: 'fill',
        source: 'fill1',
        layout: {},
        paint: {
            // 'fill-color': '#c62457',
            'fill-pattern': 'single',
            'fill-outline-color': '#c62457'
        },
    });

    // mapR.addLayer({
    //     id: 'outline1',
    //     type: 'line',
    //     source: 'fill1',
    //     layout: {},
    //     paint: {
    //         'line-color': '#c62457',
    //         // 'fill-pattern': 'single'
    //     },
    // });
}

const point = () => {
    const geojson = {
        'type': 'FeatureCollection',
        'features': [] as any
    }
    const testPoint = [[108, 18], [109, 18], [110, 18], [108, 19], [109, 19], [110, 19], [111, 19], [109, 20], [110, 20], [121, 20], [122, 20], [99, 21], [100, 21], [101, 21], [106, 21], [107, 21], [108, 21], [109, 21], [110, 21], [111, 21], [112, 21], [113, 21], [114, 21], [120, 21], [121, 21], [99, 22], [100, 22], [101, 22], [102, 22], [103, 22], [104, 22], [105, 22], [106, 22], [107, 22], [108, 22], [109, 22], [110, 22], [111, 22], [112, 22], [113, 22], [114, 22], [115, 22], [116, 22], [120, 22], [121, 22], [97, 23], [98, 23], [99, 23], [100, 23], [101, 23], [102, 23], [103, 23], [104, 23], [105, 23], [106, 23], [107, 23], [108, 23], [109, 23], [110, 23], [111, 23], [112, 23], [113, 23], [114, 23], [115, 23], [116, 23], [117, 23], [118, 23], [119, 23], [120, 23], [121, 23], [97, 24], [98, 24], [99, 24], [100, 24], [101, 24], [102, 24], [103, 24], [104, 24], [105, 24], [106, 24], [107, 24], [108, 24], [109, 24], [110, 24], [111, 24], [112, 24], [113, 24], [114, 24], [115, 24], [116, 24], [117, 24], [118, 24], [119, 24], [120, 24], [121, 24], [122, 24], [123, 24], [124, 24], [125, 24], [97, 25], [98, 25], [99, 25], [100, 25], [101, 25], [102, 25], [103, 25], [104, 25], [105, 25], [106, 25], [107, 25], [108, 25], [109, 25], [110, 25], [111, 25], [112, 25], [113, 25], [114, 25], [115, 25], [116, 25], [117, 25], [118, 25], [119, 25], [121, 25], [122, 25], [123, 25], [124, 25], [92, 26], [93, 26], [98, 26], [99, 26], [100, 26], [101, 26], [102, 26], [103, 26], [104, 26], [105, 26], [106, 26], [107, 26], [108, 26], [109, 26], [110, 26], [111, 26], [112, 26], [113, 26], [114, 26], [115, 26], [116, 26], [117, 26], [118, 26], [119, 26], [120, 26], [85, 27], [86, 27], [87, 27], [88, 27], [89, 27], [90, 27], [91, 27], [92, 27], [93, 27], [94, 27], [95, 27], [96, 27], [97, 27], [98, 27], [99, 27], [100, 27], [101, 27], [102, 27], [103, 27], [104, 27], [105, 27], [106, 27], [107, 27], [108, 27], [109, 27], [110, 27], [111, 27], [112, 27], [113, 27]]
    for (const ele of testPoint) {
        geojson.features.push({
            'type': 'Feature',
            'properties': {

            },
            'geometry': {
                'type': 'Point',
                'coordinates': ele
            }
        })
    }

    mapR.addSource('test', {
        type: 'geojson',
        data: geojson
    })

    mapR.addLayer({
        id: 'test',
        source: 'test',
        type: 'circle',
        paint: {
            'circle-color': '#ff0000',
        },
    })
}
</script>

<style lang="scss" scoped>
@import './index.scss';
</style>
