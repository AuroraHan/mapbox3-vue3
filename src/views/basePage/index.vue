<!--  -->
<template>
    <h2 @click="open">基础空白页面</h2>
    <hr>

    <div v-for="(value) in 100">
        <Heavy v-if="defer(value)"></Heavy>
    </div>


</template>

<script setup lang='ts'>
import { reactive, ref, onBeforeMount, onMounted } from 'vue'
import * as Turf from '@turf/turf'
import mapboxgl from "mapbox-gl";
import Heavy from './heavy.vue';
import { useDefer } from '/@/hooks/useDefer'

const defer = useDefer()
</script>
<style scoped>
h2 {
    text-align: center;
}

.time-line {
    width: 100%;
    height: 30px;
    background-image: repeating-linear-gradient(to right, black 0px, black 0.1px, transparent 1px, transparent 5px);
}
</style>