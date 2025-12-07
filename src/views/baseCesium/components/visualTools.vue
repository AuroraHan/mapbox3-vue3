<template>
    <WinControl v-if="modelValue" :initCss="{ width: 370, height: 300, x: 200, y: 350 }" :title="'可视化分析'">
        <template #close><el-button @click="hide" type="danger">关闭</el-button></template>
        <div class="container">
            <div class="btns">
                <el-button class="btns" type="success" @click="onClickRain">江西年降雨图</el-button>
                <el-button type="success" @click="addWater">水体</el-button>
            </div>
            <div class="clear">
                <el-button @click="clearLayer" type="warning">清空</el-button>
            </div>
        </div>
    </WinControl>
</template>

<script lang='ts' setup>
import { ref, onMounted } from 'vue';
import WinControl from '@/components/winControl/index.vue'
import * as Cesium from 'cesium';
import { stainRain } from './visualTools'


const props = defineProps({
    modelValue: {
        type: Boolean
    },
    viewerI: {
        type: Cesium.Viewer
    },

})
const emits = defineEmits(['update:modelValue'])

const hide = () => {
    emits('update:modelValue', false)
}

let rainPngPri: any;
const onClickRain = async () => {
    const cesiumV = props.viewerI!
    rainPngPri = await stainRain(cesiumV)
}

//清空降雨层
const clearLayer = () => {
    const cesiumV = props.viewerI!
    // console.log(cesiumV.scene.primitives);
    // console.log(rainPngPri);
    cesiumV.entities.removeAll()
    cesiumV.scene.primitives.remove(rainPngPri)
}

//添加水体
const addWater = () => {
    const cesiumV = props.viewerI
    cesiumV?.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(125.5, 30.5, 30000)
    })

    const waterm = new Cesium.Material({
        fabric: {
            type: 'Water',
            uniforms: {
                baseWaterColor: new Cesium.Color(0.0, 0.1, 0.15, 0.9),
                normalMap: '/images/waterNormals.jpg',
                frequency: 200,//水面波纹频率
                animationSpeed: 0.01,//水面波动动画速率
                amplitude: 20,//水面波动幅度
                specularIntensity: 2.0//水面反射强度
            }
        }
    })

    const waterPoint = [
        125, 30,
        126, 30,
        126, 31,
        125, 31
    ]

    const waterPolygon = new Cesium.PolygonGeometry({
        //水体关键点
        polygonHierarchy: new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromDegreesArray(waterPoint)),
        //水体底高程
        extrudedHeight: 0.0,
        //高度
        height: 1000
    })

    const primitive = new Cesium.Primitive({
        //几何体
        geometryInstances: new Cesium.GeometryInstance({
            geometry: waterPolygon
        }),

        //材质
        appearance: new Cesium.EllipsoidSurfaceAppearance({
            material: waterm
        }),

        //接受影印
        shadows: Cesium.ShadowMode.RECEIVE_ONLY
    })

    cesiumV?.scene.primitives.add(primitive)

}

</script>
<style lang='scss' scoped>
.container {
    display: flex;
    flex-wrap: wrap;
    flex-direction: column;

    .tile {
        font-size: 18px;
        font-weight: inherit;
        margin-bottom: 8px;
    }

    .btns {
        display: flex;
        flex-wrap: wrap;
        justify-content: left;

        button {
            margin-bottom: 6px;
        }
    }

    .clear {
        margin-top: 10px;
    }
}
</style>