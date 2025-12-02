<template>
    <WinControl v-if="modelValue" :initCss="{ width: 350, height: 200, x: 500, y: 300 }" :title="'年降雨量'">
        <div>
            <el-button @click="stainRain" type="success">江西</el-button>
            <el-button @click="hide" type="danger">关闭</el-button>
        </div>
    </WinControl>
</template>

<script lang='ts' setup>
import { ref, toRefs } from 'vue';
import WinControl from '@/components/winControl/index.vue'
import mapboxgl from 'mapbox-gl';
import * as Cesium from 'cesium';
import krigingExport from 'kriging'
import { removeLayerAndSource } from '@/utils/mapTools'
const { kriging } = krigingExport


const props = defineProps({
    modelValue: {
        type: Boolean
    },
    mapI: {
        type: mapboxgl.Map
    },

})

const emits = defineEmits(['update:modelValue'])

const hide = () => {
    clearAll()
    emits('update:modelValue', false)
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

const canvasLayer = 'canvas-layer'
const proLayer = 'outline'

//使用克里金插值降雨量
const stainRain = async () => {
    const mapR = props.mapI
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

    mapR?.addSource(canvasLayer, {
        type: 'canvas',
        canvas: canvas,
        coordinates: [
            [minx, maxy],
            [maxx, maxy],
            [maxx, miny],
            [minx, miny]
        ],

    });

    mapR?.addLayer({
        id: canvasLayer,
        type: 'raster',
        source: canvasLayer
    });

    mapR?.addSource(proLayer, {
        type: 'geojson',
        data: jxData
    })

    mapR?.addLayer({
        id: proLayer,
        type: 'line',
        source: proLayer,
        layout: {},
        paint: {
            'line-color': '#c62457',
            'line-width': 2
            // 'fill-color': '#c62457',
            // 'fill-pattern': 'rocket'
        },
    });

    mapR?.addLayer({
        id: 'point',
        type: 'circle',
        source: {
            type: 'geojson',
            data: precipitationData
        },
        paint: {
            'circle-color': '#ffff00',
            'circle-radius': 3
        },

    })

    mapR?.addLayer({
        id: 'point-text',
        type: 'symbol',
        source: {
            type: 'geojson',
            data: precipitationData
        },
        paint: {
            'text-color': '#ffff00',
        },
        layout: {
            'text-field': ['get', 'country'],
        }
    })
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

const clearAll = () => {
    const mapR = props.mapI
    removeLayerAndSource(mapR!, canvasLayer, 1)
    removeLayerAndSource(mapR!, canvasLayer, 0)

    removeLayerAndSource(mapR!, proLayer, 1)
    removeLayerAndSource(mapR!, proLayer, 0)

    removeLayerAndSource(mapR!, 'point', 1)
    removeLayerAndSource(mapR!, 'point', 0)
    removeLayerAndSource(mapR!, 'point-text', 1)
    removeLayerAndSource(mapR!, 'point-text', 0)
}

</script>
<style lang='scss' scoped></style>