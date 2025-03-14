<!-- 工具类绘制 -->
<template>
    <WinControl :initCss="{ width: 250, height: 160, x: 300, y: 200 }">
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
        </div>
    </WinControl>
</template>

<script setup lang='ts'>
import { reactive, PropType, toRefs } from 'vue'
//@ts-ignore
import WinControl from '@/components/winControl/index.vue'

const props = defineProps({
    drawI: {
        type: Object as PropType<{ changeMode, deleteAll }>
    }
})

const { drawI } = toRefs(props)

const models = reactive({
    plotType: '',
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
}

//删除绘制内容
const delDraw = () => {
    drawI?.value?.deleteAll()
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
    justify-content: space-around;
}
</style>