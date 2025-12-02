<template>
    <WinControl v-if="modelValue" :initCss="{ width: 350, height: 300, x: 600, y: 350 }" :title="'集成工具'">
        <template #close><el-button @click="hide" type="danger">关闭</el-button></template>
        <div>
            集成工具
        </div>
    </WinControl>
</template>

<script lang='ts' setup>
import { ref, onMounted } from 'vue';
import WinControl from '@/components/winControl/index.vue'
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