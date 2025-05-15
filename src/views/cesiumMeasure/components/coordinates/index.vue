<!--  -->
<template>
    <WinControl :initCss="{ width: 300, height: 260, x: 300, y: 200 }">
        <coordPlot></coordPlot>
    </WinControl>
</template>

<script setup lang='ts'>
import coordPlot from './coordPlot.vue';
import * as Cesium from 'cesium';
//@ts-ignore
import WinControl from '/@/components/winControl/index.vue'

</script>
<style scoped lang='scss'></style>