<!--  -->
<template>
    <WinControl :initCss="{ x: 700, y: 400 }">
        <coordPlot></coordPlot>
    </WinControl>
</template>

<script setup lang='ts'>
import coordPlot from './measureUtils.vue'
//@ts-ignore
import WinControl from '@/components/winControl/index.vue'


</script>
<style scoped lang='scss'></style>