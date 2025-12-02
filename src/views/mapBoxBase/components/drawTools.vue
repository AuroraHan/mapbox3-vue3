<!-- 工具类绘制 -->
<template>
    <WinControl :initCss="{ width: 250, height: 200, x: 400, y: 400 }">
        <div>
            <div class="list">
                <div class="name">标绘:</div>
                <el-radio-group v-model="models.plotType">
                    <el-radio-button label="点" value="point" />
                    <el-radio-button label="线" value="line" />
                    <el-radio-button label="面" value="polygon" />
                </el-radio-group>
            </div>
            <div class="btns">
                <el-button type="primary" @click="draw">绘制</el-button>
                <el-button type="danger" @click="delDraw">删除</el-button>
            </div>
            <div class="btns">
                <span>*</span>
                <div v-if="models.area">面积{{ models.area }}</div>
                <div v-if="models.long">距离{{ models.long }}</div>
                <span>*</span>
            </div>
        </div>
    </WinControl>
</template>

<script setup lang='ts'>
import { reactive, PropType, toRefs } from 'vue'
import * as Turf from '@turf/turf'
import mapboxgl from 'mapbox-gl';
import WinControl from '@/components/winControl/index.vue'

const props = defineProps({
    drawI: {
        type: Object as PropType<{ changeMode, deleteAll }>
    },
    mapI: {
        type: mapboxgl.Map
    }
})

const { drawI } = toRefs(props)

const models = reactive({
    plotType: '',
    area: '',
    long: ''
})

//绘制
const draw = () => {
    switch (models.plotType) {
        case 'point':
            drawI?.value?.changeMode('draw_point')
            break;
        case 'line':
            drawI?.value?.changeMode('draw_line_string')
            break;
        case 'polygon':
            drawI?.value?.changeMode('draw_polygon')
            break;
        default:
            break;
    }
    listener()
}

//删除绘制内容
const delDraw = () => {
    drawI?.value?.deleteAll()
    models.long = ''
    models.area = ''
}

const listener = () => {
    // @ts-ignore
    props.mapI.on('draw.create', updateArea);
    // @ts-ignore
    // props.mapI.on('draw.delete', deleteFn);
    // @ts-ignore
    // props.mapI.on('draw.update', updateArea);

    function updateArea(e: any) {
        console.log(e, 'eeeee');
        //计算距离
        if (models.plotType == 'line') {
            models.long = (Turf.length(e.features[0])).toFixed(2) + 'km'
            models.area = ''
        }

        //计算面积
        if (models.plotType == 'polygon') {
            models.area = (Turf.area(e.features[0]) / 1000000).toFixed(2) + 'km²'
            models.long = ''
        }
    }

}

</script>
<style scoped lang='scss'>
.list {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    justify-content: center;
    margin: 20px 0;

    .name {
        font-size: 17px;
        font-weight: bold;
        margin-right: 8px;
    }
}

.btns {
    display: flex;
    justify-content: center;
    margin-top: 20px;
}
</style>