<template>
    <WinControl v-if="modelValue" :initCss="{ width: 350, height: 300, x: 200, y: 350 }" :title="'可视化分析'">
        <template #close><el-button @click="hide" type="danger">关闭</el-button></template>
        <div>
            可视化工具
        </div>
    </WinControl>
</template>

<script lang='ts' setup>
import { ref, onMounted } from 'vue';
import WinControl from '/@/components/winControl/index.vue'
import * as Cesium from 'cesium';


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


</script>
<style lang='scss' scoped></style>