<template>
    <div class="container">
        <div class="box" v-for="(item, index) in routsList" @click="onClick(item)">{{ item.name }}</div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const routsList = ref([
    {
        name: '基础空白页面',
        path: 'basePage'
    },
    {
        name: '基础mapbox',
        path: 'mapBoxBase'
    },
    {
        name: 'mapbox各种效果',
        path: 'mapboxLayer'
    },
    {
        name: '基础Cesium',
        path: 'baseCesium'
    },
    {
        name: 'three火焰',
        path: 'baseThree'
    },
    {
        name: '弹出框',
        path: 'popup'
    },
    {
        name: '图层切换',
        path: 'mapboxVector'
    },
    {
        name: 'threeBox烟雾',
        path: 'baseThreeBox'
    },

    {
        name: '飞机飞行',
        path: 'mapBoxAircraft'
    },
    {
        name: 'L7',
        path: 'mapboxL7'
    },
    {
        name: '风场加载',
        path: 'mapboxWind'
    },
    {
        name: 'cesium弹出框',
        path: 'cesiumPopup'
    },
])


const onClick = (item) => {
    router.push({ name: item.path })
}

</script>

<style scoped lang="scss">
.container {
    padding: 5px;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
    grid-template-rows: 230px 230px 230px 230px;
    grid-gap: 8px;
    height: 100%;

    .box {
        background-color: aquamarine;
        cursor: pointer;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 18px;
    }
}
</style>