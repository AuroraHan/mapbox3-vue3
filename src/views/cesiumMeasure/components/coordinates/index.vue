<!--  -->
<template>
    <WinControl>

    </WinControl>
    <!-- <div class="m-coordinates">
        <coordPlot></coordPlot>
    </div> -->
</template>

<script setup lang='ts'>
import coordPlot from './coordPlot.vue';
import WinControl from '../../../../components/winControl/index.vue'
</script>
<style scoped lang='scss'>
.m-coordinates {
    z-index: 9;
    position: absolute;
    right: 10%;
    bottom: 5%;
    width: 200px;
    height: 80px;
    background-color: antiquewhite;
}
</style>