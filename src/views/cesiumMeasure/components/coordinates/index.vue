<!--  -->
<template>
    <WinControl>
        <coordPlot :viewer="viewer"></coordPlot>
    </WinControl>
</template>

<script setup lang='ts'>
import { defineProps } from 'vue'
import * as Cesium from 'cesium';
import coordPlot from './coordPlot.vue';
import WinControl from '../../../../components/winControl/index.vue'

const props = defineProps({
    typeC: {
        type: String
    },

    viewer: {
        type: Cesium.Viewer
    }

})

</script>
<style scoped lang='scss'></style>