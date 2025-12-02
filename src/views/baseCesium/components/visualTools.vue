<template>
    <WinControl v-if="modelValue" :initCss="{ width: 370, height: 300, x: 200, y: 350 }" :title="'可视化分析'">
        <template #close><el-button @click="hide" type="danger">关闭</el-button></template>
        <div class="container">
            <div class="tile">全国省份年降雨图</div>
            <div class="btns">
                <el-button type="success" @click="onClickRain">江西</el-button>
                <el-button type="success">湖南</el-button>
                <el-button type="success">湖北</el-button>
                <el-button type="success">浙江</el-button>
                <el-button type="success">北京</el-button>
                <!-- <el-button type="success">北京</el-button>
                <el-button type="success">北京</el-button> -->
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